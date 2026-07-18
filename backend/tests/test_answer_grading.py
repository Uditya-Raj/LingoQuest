"""Pure unit tests for Phase 5A exercise graders."""
import pytest

from app.core.errors import DomainError
from app.services.answer_grading import grade_answer, normalize_text


# ---------------------------------------------------------------------------
# Fixtures / sample contracts
# ---------------------------------------------------------------------------

MC_OPTIONS = [
    {"id": "a", "text": "Hello"},
    {"id": "b", "text": "Goodbye"},
    {"id": "c", "text": "Please"},
]
MC_CORRECT = {"option_id": "a"}

WB_OPTIONS = [
    {"id": "w1", "text": "I"},
    {"id": "w2", "text": "drink"},
    {"id": "w3", "text": "water"},
    {"id": "w4", "text": "bread"},
]
WB_CORRECT = {"ordered_ids": ["w1", "w2", "w3"]}

MP_OPTIONS = {
    "left": [
        {"id": "l1", "text": "agua"},
        {"id": "l2", "text": "pan"},
    ],
    "right": [
        {"id": "r1", "text": "water"},
        {"id": "r2", "text": "bread"},
    ],
}
MP_CORRECT = {
    "pairs": [
        {"left_id": "l1", "right_id": "r1"},
        {"left_id": "l2", "right_id": "r2"},
    ]
}

FB_CORRECT = {"text": "es"}
TA_CORRECT = {"accepted": ["hello", "hi"]}


def _expect_code(exc_info, code: str) -> None:
    assert isinstance(exc_info.value, DomainError)
    assert exc_info.value.code == code
    assert exc_info.value.status_code == 400


# ---------------------------------------------------------------------------
# multiple_choice
# ---------------------------------------------------------------------------

class TestMultipleChoice:
    def test_correct(self):
        result = grade_answer("multiple_choice", MC_OPTIONS, MC_CORRECT, {"option_id": "a"})
        assert result.is_correct is True
        assert result.revealed_correct_answer == {"option_id": "a"}

    def test_incorrect(self):
        result = grade_answer("multiple_choice", MC_OPTIONS, MC_CORRECT, {"option_id": "b"})
        assert result.is_correct is False
        assert result.revealed_correct_answer == {"option_id": "a"}

    def test_unknown_option(self):
        with pytest.raises(DomainError) as exc:
            grade_answer("multiple_choice", MC_OPTIONS, MC_CORRECT, {"option_id": "z"})
        _expect_code(exc, "INVALID_OPTION_REFERENCE")

    def test_extra_field(self):
        with pytest.raises(DomainError) as exc:
            grade_answer(
                "multiple_choice",
                MC_OPTIONS,
                MC_CORRECT,
                {"option_id": "a", "extra": True},
            )
        _expect_code(exc, "INVALID_ANSWER_SHAPE")

    def test_missing_field(self):
        with pytest.raises(DomainError) as exc:
            grade_answer("multiple_choice", MC_OPTIONS, MC_CORRECT, {})
        _expect_code(exc, "INVALID_ANSWER_SHAPE")

    def test_null_answer(self):
        with pytest.raises(DomainError) as exc:
            grade_answer("multiple_choice", MC_OPTIONS, MC_CORRECT, None)
        _expect_code(exc, "INVALID_ANSWER_SHAPE")

    def test_non_object_answer(self):
        with pytest.raises(DomainError) as exc:
            grade_answer("multiple_choice", MC_OPTIONS, MC_CORRECT, "a")
        _expect_code(exc, "INVALID_ANSWER_SHAPE")


# ---------------------------------------------------------------------------
# translate_word_bank
# ---------------------------------------------------------------------------

class TestWordBank:
    def test_correct(self):
        result = grade_answer(
            "translate_word_bank",
            WB_OPTIONS,
            WB_CORRECT,
            {"ordered_ids": ["w1", "w2", "w3"]},
        )
        assert result.is_correct is True

    def test_incorrect_order(self):
        result = grade_answer(
            "translate_word_bank",
            WB_OPTIONS,
            WB_CORRECT,
            {"ordered_ids": ["w1", "w3", "w2"]},
        )
        assert result.is_correct is False

    def test_unknown_id(self):
        with pytest.raises(DomainError) as exc:
            grade_answer(
                "translate_word_bank",
                WB_OPTIONS,
                WB_CORRECT,
                {"ordered_ids": ["w1", "w99"]},
            )
        _expect_code(exc, "INVALID_OPTION_REFERENCE")

    def test_duplicate_ids(self):
        with pytest.raises(DomainError) as exc:
            grade_answer(
                "translate_word_bank",
                WB_OPTIONS,
                WB_CORRECT,
                {"ordered_ids": ["w1", "w1", "w2"]},
            )
        _expect_code(exc, "INVALID_ANSWER_SHAPE")

    def test_extra_field(self):
        with pytest.raises(DomainError) as exc:
            grade_answer(
                "translate_word_bank",
                WB_OPTIONS,
                WB_CORRECT,
                {"ordered_ids": ["w1", "w2", "w3"], "bonus": 1},
            )
        _expect_code(exc, "INVALID_ANSWER_SHAPE")


# ---------------------------------------------------------------------------
# match_pairs
# ---------------------------------------------------------------------------

class TestMatchPairs:
    def test_correct(self):
        result = grade_answer("match_pairs", MP_OPTIONS, MP_CORRECT, MP_CORRECT)
        assert result.is_correct is True

    def test_order_independence(self):
        reordered = {
            "pairs": [
                {"left_id": "l2", "right_id": "r2"},
                {"left_id": "l1", "right_id": "r1"},
            ]
        }
        result = grade_answer("match_pairs", MP_OPTIONS, MP_CORRECT, reordered)
        assert result.is_correct is True

    def test_incorrect_pairing(self):
        wrong = {
            "pairs": [
                {"left_id": "l1", "right_id": "r2"},
                {"left_id": "l2", "right_id": "r1"},
            ]
        }
        result = grade_answer("match_pairs", MP_OPTIONS, MP_CORRECT, wrong)
        assert result.is_correct is False

    def test_unknown_id(self):
        with pytest.raises(DomainError) as exc:
            grade_answer(
                "match_pairs",
                MP_OPTIONS,
                MP_CORRECT,
                {"pairs": [{"left_id": "l1", "right_id": "r99"}, {"left_id": "l2", "right_id": "r1"}]},
            )
        _expect_code(exc, "INVALID_OPTION_REFERENCE")

    def test_duplicate_left(self):
        with pytest.raises(DomainError) as exc:
            grade_answer(
                "match_pairs",
                MP_OPTIONS,
                MP_CORRECT,
                {
                    "pairs": [
                        {"left_id": "l1", "right_id": "r1"},
                        {"left_id": "l1", "right_id": "r2"},
                    ]
                },
            )
        _expect_code(exc, "INVALID_ANSWER_SHAPE")

    def test_incomplete_pairs(self):
        with pytest.raises(DomainError) as exc:
            grade_answer(
                "match_pairs",
                MP_OPTIONS,
                MP_CORRECT,
                {"pairs": [{"left_id": "l1", "right_id": "r1"}]},
            )
        _expect_code(exc, "INVALID_ANSWER_SHAPE")


# ---------------------------------------------------------------------------
# fill_blank
# ---------------------------------------------------------------------------

class TestFillBlank:
    def test_correct(self):
        result = grade_answer("fill_blank", None, FB_CORRECT, {"text": "es"})
        assert result.is_correct is True

    def test_incorrect(self):
        result = grade_answer("fill_blank", None, FB_CORRECT, {"text": "soy"})
        assert result.is_correct is False

    def test_case_and_whitespace(self):
        result = grade_answer("fill_blank", None, FB_CORRECT, {"text": "  Es  "})
        assert result.is_correct is True

    def test_empty_text(self):
        with pytest.raises(DomainError) as exc:
            grade_answer("fill_blank", None, FB_CORRECT, {"text": "   "})
        _expect_code(exc, "INVALID_ANSWER_SHAPE")

    def test_extra_field(self):
        with pytest.raises(DomainError) as exc:
            grade_answer("fill_blank", None, FB_CORRECT, {"text": "es", "x": 1})
        _expect_code(exc, "INVALID_ANSWER_SHAPE")


# ---------------------------------------------------------------------------
# type_answer
# ---------------------------------------------------------------------------

class TestTypeAnswer:
    def test_correct_primary(self):
        result = grade_answer("type_answer", None, TA_CORRECT, {"text": "hello"})
        assert result.is_correct is True

    def test_correct_accepted_variant(self):
        result = grade_answer("type_answer", None, TA_CORRECT, {"text": "Hi"})
        assert result.is_correct is True

    def test_incorrect(self):
        result = grade_answer("type_answer", None, TA_CORRECT, {"text": "hey"})
        assert result.is_correct is False

    def test_empty_text(self):
        with pytest.raises(DomainError) as exc:
            grade_answer("type_answer", None, TA_CORRECT, {"text": ""})
        _expect_code(exc, "INVALID_ANSWER_SHAPE")

    def test_missing_text(self):
        with pytest.raises(DomainError) as exc:
            grade_answer("type_answer", None, TA_CORRECT, {})
        _expect_code(exc, "INVALID_ANSWER_SHAPE")


# ---------------------------------------------------------------------------
# Unicode / normalization
# ---------------------------------------------------------------------------

class TestNormalization:
    def test_normalize_helper(self):
        assert normalize_text("  Café  ") == "café"
        assert normalize_text("A\u00a0B") == "a b"  # NBSP collapses
        assert normalize_text("HELLO   WORLD") == "hello world"

    def test_unicode_fill_blank(self):
        result = grade_answer(
            "fill_blank",
            None,
            {"text": "café"},
            {"text": "  CAFÉ  "},
        )
        assert result.is_correct is True

    def test_nfkc_compatibility(self):
        # ﬁ (U+FB01) NFKC-folds toward "fi"
        result = grade_answer(
            "type_answer",
            None,
            {"accepted": ["fi"]},
            {"text": "ﬁ"},
        )
        assert result.is_correct is True
