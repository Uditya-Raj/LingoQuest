"""Pure exercise grading — no database mutation.

Reuses shared exercise-contract shapes from seed validators where applicable.
Timed-practice rules do not belong here; graders stay mode-agnostic for Phase 6B.
"""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator, model_validator

from app.core.errors import DomainError
from app.seed.validators import (
    FillBlankAnswer,
    MatchPairsAnswer,
    MatchPairsOptions,
    MultipleChoiceAnswer,
    MultipleChoiceOptions,
    TypeAnswerAnswer,
    WordBankAnswer,
    WordBankOptions,
)


@dataclass(frozen=True)
class GradeResult:
    """Typed result from a pure grader."""

    is_correct: bool
    revealed_correct_answer: dict[str, Any]


class SubmittedMultipleChoice(BaseModel):
    """Submitted multiple-choice answer."""

    model_config = ConfigDict(extra="forbid")

    option_id: str = Field(..., min_length=1)


class SubmittedWordBank(BaseModel):
    """Submitted word-bank answer."""

    model_config = ConfigDict(extra="forbid")

    ordered_ids: list[str] = Field(..., min_length=1)

    @field_validator("ordered_ids")
    @classmethod
    def no_duplicate_ids(cls, v: list[str]) -> list[str]:
        if len(v) != len(set(v)):
            raise ValueError("Answer IDs must not repeat")
        return v


class SubmittedMatchPair(BaseModel):
    """Single submitted match pair."""

    model_config = ConfigDict(extra="forbid")

    left_id: str = Field(..., min_length=1)
    right_id: str = Field(..., min_length=1)


class SubmittedMatchPairs(BaseModel):
    """Submitted match-pairs answer."""

    model_config = ConfigDict(extra="forbid")

    pairs: list[SubmittedMatchPair] = Field(..., min_length=1)

    @model_validator(mode="after")
    def validate_unique_pairs(self) -> SubmittedMatchPairs:
        left_ids = [pair.left_id for pair in self.pairs]
        right_ids = [pair.right_id for pair in self.pairs]
        if len(left_ids) != len(set(left_ids)):
            raise ValueError("Each left ID can only be used once")
        if len(right_ids) != len(set(right_ids)):
            raise ValueError("Each right ID can only be used once")
        return self


class SubmittedTextAnswer(BaseModel):
    """Submitted fill-blank or type-answer payload."""

    model_config = ConfigDict(extra="forbid")

    text: str


def normalize_text(text: str) -> str:
    """Normalize learner text for exact grading.

    1. Unicode NFKC
    2. Trim leading/trailing whitespace
    3. Collapse consecutive internal whitespace
    4. Unicode case folding
    """
    normalized = unicodedata.normalize("NFKC", text)
    normalized = normalized.strip()
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized.casefold()


def _invalid_shape(message: str) -> DomainError:
    return DomainError(
        code="INVALID_ANSWER_SHAPE",
        message=message,
        status_code=400,
    )


def _invalid_option(message: str) -> DomainError:
    return DomainError(
        code="INVALID_OPTION_REFERENCE",
        message=message,
        status_code=400,
    )


def _parse_submitted(model_cls: type[BaseModel], answer: Any) -> BaseModel:
    """Parse a submitted answer object; reject null/non-object/wrong-shape."""
    if answer is None or not isinstance(answer, dict):
        raise _invalid_shape("Answer must be a non-null object")
    try:
        return model_cls.model_validate(answer)
    except ValidationError as exc:
        raise _invalid_shape(str(exc)) from exc


def grade_answer(
    exercise_type: str,
    options: Any,
    correct_answer: dict[str, Any],
    submitted_answer: Any,
) -> GradeResult:
    """Grade a submitted answer without mutating state.

    Raises DomainError with INVALID_ANSWER_SHAPE or INVALID_OPTION_REFERENCE.
    """
    if exercise_type == "multiple_choice":
        return _grade_multiple_choice(options, correct_answer, submitted_answer)
    if exercise_type == "translate_word_bank":
        return _grade_word_bank(options, correct_answer, submitted_answer)
    if exercise_type == "match_pairs":
        return _grade_match_pairs(options, correct_answer, submitted_answer)
    if exercise_type == "fill_blank":
        return _grade_fill_blank(correct_answer, submitted_answer)
    if exercise_type == "type_answer":
        return _grade_type_answer(correct_answer, submitted_answer)
    raise _invalid_shape(f"Unknown exercise type: {exercise_type}")


def _grade_multiple_choice(
    options: Any,
    correct_answer: dict[str, Any],
    submitted_answer: Any,
) -> GradeResult:
    parsed = _parse_submitted(SubmittedMultipleChoice, submitted_answer)
    assert isinstance(parsed, SubmittedMultipleChoice)

    opts = MultipleChoiceOptions(root=options)
    option_ids = {opt.id for opt in opts.root}
    if parsed.option_id not in option_ids:
        raise _invalid_option(f"Unknown option_id: {parsed.option_id}")

    stored = MultipleChoiceAnswer.model_validate(correct_answer)
    revealed = stored.model_dump()
    return GradeResult(
        is_correct=parsed.option_id == stored.option_id,
        revealed_correct_answer=revealed,
    )


def _grade_word_bank(
    options: Any,
    correct_answer: dict[str, Any],
    submitted_answer: Any,
) -> GradeResult:
    parsed = _parse_submitted(SubmittedWordBank, submitted_answer)
    assert isinstance(parsed, SubmittedWordBank)

    opts = WordBankOptions(root=options)
    option_ids = {opt.id for opt in opts.root}
    for word_id in parsed.ordered_ids:
        if word_id not in option_ids:
            raise _invalid_option(f"Unknown word-bank id: {word_id}")

    stored = WordBankAnswer.model_validate(correct_answer)
    revealed = stored.model_dump()
    return GradeResult(
        is_correct=parsed.ordered_ids == stored.ordered_ids,
        revealed_correct_answer=revealed,
    )


def _grade_match_pairs(
    options: Any,
    correct_answer: dict[str, Any],
    submitted_answer: Any,
) -> GradeResult:
    parsed = _parse_submitted(SubmittedMatchPairs, submitted_answer)
    assert isinstance(parsed, SubmittedMatchPairs)

    opts = MatchPairsOptions.model_validate(options)
    left_ids = {opt.id for opt in opts.left}
    right_ids = {opt.id for opt in opts.right}

    for pair in parsed.pairs:
        if pair.left_id not in left_ids:
            raise _invalid_option(f"Unknown left_id: {pair.left_id}")
        if pair.right_id not in right_ids:
            raise _invalid_option(f"Unknown right_id: {pair.right_id}")

    if len(parsed.pairs) != len(opts.left):
        raise _invalid_shape("Answer must pair every left item exactly once")

    stored = MatchPairsAnswer.model_validate(correct_answer)
    revealed = stored.model_dump()

    submitted_set = {(p.left_id, p.right_id) for p in parsed.pairs}
    correct_set = {(p.left_id, p.right_id) for p in stored.pairs}
    return GradeResult(
        is_correct=submitted_set == correct_set,
        revealed_correct_answer=revealed,
    )


def _grade_fill_blank(
    correct_answer: dict[str, Any],
    submitted_answer: Any,
) -> GradeResult:
    parsed = _parse_submitted(SubmittedTextAnswer, submitted_answer)
    assert isinstance(parsed, SubmittedTextAnswer)

    normalized = normalize_text(parsed.text)
    if not normalized:
        raise _invalid_shape("Answer text must be non-empty after normalization")

    stored = FillBlankAnswer.model_validate(correct_answer)
    revealed = stored.model_dump()
    return GradeResult(
        is_correct=normalized == normalize_text(stored.text),
        revealed_correct_answer=revealed,
    )


def _grade_type_answer(
    correct_answer: dict[str, Any],
    submitted_answer: Any,
) -> GradeResult:
    parsed = _parse_submitted(SubmittedTextAnswer, submitted_answer)
    assert isinstance(parsed, SubmittedTextAnswer)

    normalized = normalize_text(parsed.text)
    if not normalized:
        raise _invalid_shape("Answer text must be non-empty after normalization")

    stored = TypeAnswerAnswer.model_validate(correct_answer)
    revealed = stored.model_dump()
    accepted = {normalize_text(value) for value in stored.accepted}
    return GradeResult(
        is_correct=normalized in accepted,
        revealed_correct_answer=revealed,
    )
