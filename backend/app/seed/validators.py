"""Shared exercise contract validation.

These validators are reused by:
- Seed data generation
- Content admin create/edit endpoints
- Runtime grading
"""
from typing import Any
import re
from pydantic import BaseModel, Field, field_validator, model_validator, RootModel


# BCP 47 language tag (simplified): language[-script|region|variant]*
_BCP47_LANG_RE = re.compile(r"^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$")


def validate_tts_fields(tts_text: str | None, tts_lang: str | None) -> None:
    """Validate optional TTS fields.

    Both must be present together, or both omitted/null.
    Rejects blank text and invalid BCP 47 language tags.
    """
    if tts_text is None and tts_lang is None:
        return

    if tts_text is None or tts_lang is None:
        raise ValueError("tts_text and tts_lang must both be provided or both omitted")

    if not str(tts_text).strip():
        raise ValueError("tts_text must be non-empty")

    lang = str(tts_lang).strip()
    if not lang:
        raise ValueError("tts_lang must be non-empty")

    if not _BCP47_LANG_RE.match(lang):
        raise ValueError(f"Invalid tts_lang BCP 47 language tag: {tts_lang}")


class MultipleChoiceOption(BaseModel):
    """Multiple choice option."""
    id: str = Field(..., min_length=1)
    text: str = Field(..., min_length=1)


class MultipleChoiceOptions(RootModel):
    """Options for multiple choice."""
    root: list[MultipleChoiceOption] = Field(..., min_length=2)
    
    @field_validator('root')
    @classmethod
    def unique_ids(cls, v: list[MultipleChoiceOption]) -> list[MultipleChoiceOption]:
        ids = [opt.id for opt in v]
        if len(ids) != len(set(ids)):
            raise ValueError("Option IDs must be unique")
        return v


class MultipleChoiceAnswer(BaseModel):
    """Correct answer for multiple choice."""
    option_id: str = Field(..., min_length=1)


class WordBankOption(BaseModel):
    """Word bank option."""
    id: str = Field(..., min_length=1)
    text: str = Field(..., min_length=1)


class WordBankOptions(RootModel):
    """Options for word bank."""
    root: list[WordBankOption] = Field(..., min_length=2)
    
    @field_validator('root')
    @classmethod
    def unique_ids(cls, v: list[WordBankOption]) -> list[WordBankOption]:
        ids = [opt.id for opt in v]
        if len(ids) != len(set(ids)):
            raise ValueError("Option IDs must be unique")
        return v


class WordBankAnswer(BaseModel):
    """Correct answer for word bank."""
    ordered_ids: list[str] = Field(..., min_length=1)
    
    @field_validator('ordered_ids')
    @classmethod
    def no_duplicate_ids(cls, v: list[str]) -> list[str]:
        if len(v) != len(set(v)):
            raise ValueError("Answer IDs must not repeat")
        return v


class MatchPairsOption(BaseModel):
    """Match pairs side option."""
    id: str = Field(..., min_length=1)
    text: str = Field(..., min_length=1)


class MatchPairsOptions(BaseModel):
    """Options for match pairs."""
    left: list[MatchPairsOption] = Field(..., min_length=2)
    right: list[MatchPairsOption] = Field(..., min_length=2)
    
    @model_validator(mode='after')
    def validate_unique_ids(self) -> 'MatchPairsOptions':
        left_ids = [opt.id for opt in self.left]
        right_ids = [opt.id for opt in self.right]
        
        if len(left_ids) != len(set(left_ids)):
            raise ValueError("Left option IDs must be unique")
        if len(right_ids) != len(set(right_ids)):
            raise ValueError("Right option IDs must be unique")
        
        return self


class MatchPairsPair(BaseModel):
    """Single pair in match pairs answer."""
    left_id: str
    right_id: str


class MatchPairsAnswer(BaseModel):
    """Correct answer for match pairs."""
    pairs: list[MatchPairsPair] = Field(..., min_length=1)
    
    @model_validator(mode='after')
    def validate_unique_pairs(self) -> 'MatchPairsAnswer':
        left_ids = [pair.left_id for pair in self.pairs]
        right_ids = [pair.right_id for pair in self.pairs]
        
        if len(left_ids) != len(set(left_ids)):
            raise ValueError("Each left ID can only be used once")
        if len(right_ids) != len(set(right_ids)):
            raise ValueError("Each right ID can only be used once")
        
        return self


class FillBlankAnswer(BaseModel):
    """Correct answer for fill blank."""
    text: str = Field(..., min_length=1)


class TypeAnswerAnswer(BaseModel):
    """Correct answer for type answer."""
    accepted: list[str] = Field(..., min_length=1)
    
    @field_validator('accepted')
    @classmethod
    def non_empty_strings(cls, v: list[str]) -> list[str]:
        for text in v:
            if not text.strip():
                raise ValueError("Accepted answers must be non-empty")
        if len(v) != len(set(text.strip().lower() for text in v)):
            raise ValueError("Accepted answers must be unique when normalized")
        return v


def validate_exercise_contract(
    exercise_type: str,
    prompt: str,
    options: Any,
    correct_answer: dict[str, Any],
    tts_text: str | None = None,
    tts_lang: str | None = None,
) -> None:
    """Validate exercise contract for any type.
    
    Raises ValueError if the contract is invalid.
    
    Args:
        exercise_type: One of the five supported types
        prompt: Exercise prompt text
        options: Type-specific options (may be None)
        correct_answer: Type-specific correct answer
        tts_text: Optional Speech Synthesis text
        tts_lang: Optional BCP 47 language tag for TTS
    """
    # Common validation
    if not prompt or not prompt.strip():
        raise ValueError("Prompt must be non-empty")

    validate_tts_fields(tts_text, tts_lang)
    
    # Type-specific validation
    if exercise_type == "multiple_choice":
        if options is None:
            raise ValueError("multiple_choice requires options")
        
        # Validate options structure
        opts = MultipleChoiceOptions(root=options)
        option_ids = {opt.id for opt in opts.root}
        
        # Validate answer references valid option
        answer = MultipleChoiceAnswer(**correct_answer)
        if answer.option_id not in option_ids:
            raise ValueError(f"Answer references non-existent option: {answer.option_id}")
    
    elif exercise_type == "translate_word_bank":
        if options is None:
            raise ValueError("translate_word_bank requires options")
        
        # Validate options structure
        opts = WordBankOptions(root=options)
        option_ids = {opt.id for opt in opts.root}
        
        # Validate answer references valid options
        answer = WordBankAnswer(**correct_answer)
        for word_id in answer.ordered_ids:
            if word_id not in option_ids:
                raise ValueError(f"Answer references non-existent option: {word_id}")
    
    elif exercise_type == "match_pairs":
        if options is None:
            raise ValueError("match_pairs requires options")
        
        # Validate options structure
        opts = MatchPairsOptions(**options)
        left_ids = {opt.id for opt in opts.left}
        right_ids = {opt.id for opt in opts.right}
        
        # Validate answer references valid options
        answer = MatchPairsAnswer(**correct_answer)
        for pair in answer.pairs:
            if pair.left_id not in left_ids:
                raise ValueError(f"Answer references non-existent left option: {pair.left_id}")
            if pair.right_id not in right_ids:
                raise ValueError(f"Answer references non-existent right option: {pair.right_id}")
        
        # Ensure all left items are paired exactly once
        if len(answer.pairs) != len(opts.left):
            raise ValueError("Answer must pair every left item exactly once")
    
    elif exercise_type == "fill_blank":
        if options is not None:
            raise ValueError("fill_blank must have null options")
        
        # Validate prompt has exactly one blank
        if prompt.count("___") != 1:
            raise ValueError("fill_blank prompt must contain exactly one '___' marker")
        
        # Validate answer
        answer = FillBlankAnswer(**correct_answer)
    
    elif exercise_type == "type_answer":
        if options is not None:
            raise ValueError("type_answer must have null options")
        
        # Validate answer
        answer = TypeAnswerAnswer(**correct_answer)
    
    else:
        raise ValueError(f"Unknown exercise type: {exercise_type}")
