"""Course content definitions and achievement specs."""
from typing import Any


def get_course_definition() -> dict[str, Any]:
    """Return Spanish course definition."""
    return {
        "language_code": "es",
        "from_language_code": "en",
        "title": "Spanish",
        "icon": "spanish-course",
    }


def get_units_definition() -> list[dict[str, Any]]:
    """Return ordered unit definitions."""
    return [
        {
            "order_index": 0,
            "title": "First Steps",
            "description": "Introduce yourself and use essential Spanish words.",
            "color_theme": "meadow",
        },
        {
            "order_index": 1,
            "title": "Everyday Life",
            "description": "Talk about food, drinks, and the people close to you.",
            "color_theme": "ocean",
        },
        {
            "order_index": 2,
            "title": "Conversations",
            "description": "Ask and understand useful everyday questions.",
            "color_theme": "violet",
        },
    ]


def get_skills_definition() -> list[dict[str, Any]]:
    """Return ordered skill definitions with prerequisites."""
    return [
        {
            "unit_index": 0,
            "order_index": 0,
            "title": "Greetings",
            "description": "Say hello, goodbye, and use polite expressions.",
            "icon": "wave",
            "prerequisite_skill_index": None,
            "max_level": 5,
        },
        {
            "unit_index": 0,
            "order_index": 1,
            "title": "Basics",
            "description": "Build short sentences with people, articles, and the verb ser.",
            "icon": "spark",
            "prerequisite_skill_index": 0,  # Greetings
            "max_level": 5,
        },
        {
            "unit_index": 1,
            "order_index": 0,
            "title": "Food",
            "description": "Recognize common food and drink words.",
            "icon": "apple",
            "prerequisite_skill_index": 1,  # Basics
            "max_level": 5,
        },
        {
            "unit_index": 1,
            "order_index": 1,
            "title": "Family",
            "description": "Describe close family members.",
            "icon": "home-heart",
            "prerequisite_skill_index": 2,  # Food
            "max_level": 5,
        },
        {
            "unit_index": 2,
            "order_index": 0,
            "title": "Questions",
            "description": "Ask who, what, where, when, and how.",
            "icon": "question-bubble",
            "prerequisite_skill_index": 3,  # Family
            "max_level": 5,
        },
    ]


def get_exercises_for_skill(skill_index: int) -> list[dict[str, Any]]:
    """Return 12 exercises for a skill with required type distribution.
    
    Distribution per skill:
    - 3 multiple_choice
    - 2 translate_word_bank
    - 2 match_pairs
    - 2 fill_blank
    - 3 type_answer
    """
    exercises_by_skill = [
        _get_greetings_exercises(),
        _get_basics_exercises(),
        _get_food_exercises(),
        _get_family_exercises(),
        _get_questions_exercises(),
    ]
    
    exercises = exercises_by_skill[skill_index]
    _apply_seed_tts(skill_index, exercises)
    return exercises


# At least three TTS-enabled exercises per skill; all five types across the course.
# Original Spanish text; tts_lang is normally es-ES.
_SEED_TTS: dict[int, dict[int, tuple[str, str]]] = {
    0: {  # Greetings — MC, word bank, match, fill
        0: ("hola", "es-ES"),
        3: ("Buenas tardes", "es-ES"),
        5: ("adiós", "es-ES"),
        7: ("Me llamo Ana", "es-ES"),
    },
    1: {  # Basics — MC, fill, type
        0: ("yo soy", "es-ES"),
        7: ("Ella es estudiante", "es-ES"),
        9: ("el libro", "es-ES"),
    },
    2: {  # Food — word bank, match, type
        3: ("Yo bebo agua", "es-ES"),
        5: ("pan", "es-ES"),
        9: ("la manzana", "es-ES"),
    },
    3: {  # Family — MC, match, fill
        0: ("madre", "es-ES"),
        5: ("hermana", "es-ES"),
        7: ("Mi padre es alto", "es-ES"),
    },
    4: {  # Questions — word bank, fill, type
        3: ("¿Dónde está?", "es-ES"),
        7: ("¿Qué es esto?", "es-ES"),
        9: ("quién", "es-ES"),
    },
}


def _apply_seed_tts(skill_index: int, exercises: list[dict[str, Any]]) -> None:
    """Attach original TTS fields to selected exercises without changing row counts."""
    mapping = _SEED_TTS.get(skill_index, {})
    for exercise in exercises:
        pair = mapping.get(exercise["order_index"])
        if pair is None:
            exercise.setdefault("tts_text", None)
            exercise.setdefault("tts_lang", None)
        else:
            exercise["tts_text"] = pair[0]
            exercise["tts_lang"] = pair[1]


def _get_greetings_exercises() -> list[dict[str, Any]]:
    """Greetings skill exercises."""
    return [
        # Multiple choice (3)
        {
            "order_index": 0,
            "type": "multiple_choice",
            "prompt": "What does 'hola' mean?",
            "audio_url": None,
            "options": [
                {"id": "greet_mc_01_a", "text": "Hello"},
                {"id": "greet_mc_01_b", "text": "Goodbye"},
                {"id": "greet_mc_01_c", "text": "Please"},
                {"id": "greet_mc_01_d", "text": "Thank you"},
            ],
            "correct_answer": {"option_id": "greet_mc_01_a"},
            "metadata": {"hint": "It's a common greeting.", "difficulty": 1},
        },
        {
            "order_index": 1,
            "type": "multiple_choice",
            "prompt": "How do you say 'thank you' in Spanish?",
            "audio_url": None,
            "options": [
                {"id": "greet_mc_02_a", "text": "Por favor"},
                {"id": "greet_mc_02_b", "text": "Gracias"},
                {"id": "greet_mc_02_c", "text": "Adiós"},
                {"id": "greet_mc_02_d", "text": "Hola"},
            ],
            "correct_answer": {"option_id": "greet_mc_02_b"},
            "metadata": {"hint": "Used to express gratitude.", "difficulty": 1},
        },
        {
            "order_index": 2,
            "type": "multiple_choice",
            "prompt": "What is 'good morning' in Spanish?",
            "audio_url": None,
            "options": [
                {"id": "greet_mc_03_a", "text": "Buenas noches"},
                {"id": "greet_mc_03_b", "text": "Buenos días"},
                {"id": "greet_mc_03_c", "text": "Buenas tardes"},
            ],
            "correct_answer": {"option_id": "greet_mc_03_b"},
            "metadata": {"hint": "Used before noon.", "difficulty": 1},
        },
        # Translate word bank (2)
        {
            "order_index": 3,
            "type": "translate_word_bank",
            "prompt": "Build: 'Good evening'",
            "audio_url": None,
            "options": [
                {"id": "greet_wb_01_buenas", "text": "Buenas"},
                {"id": "greet_wb_01_tardes", "text": "tardes"},
                {"id": "greet_wb_01_noches", "text": "noches"},
                {"id": "greet_wb_01_dias", "text": "días"},
            ],
            "correct_answer": {
                "ordered_ids": ["greet_wb_01_buenas", "greet_wb_01_tardes"]
            },
            "metadata": {"hint": "Used in the afternoon/evening.", "difficulty": 1},
        },
        {
            "order_index": 4,
            "type": "translate_word_bank",
            "prompt": "Build: 'See you later'",
            "audio_url": None,
            "options": [
                {"id": "greet_wb_02_hasta", "text": "Hasta"},
                {"id": "greet_wb_02_luego", "text": "luego"},
                {"id": "greet_wb_02_adios", "text": "adiós"},
                {"id": "greet_wb_02_hola", "text": "hola"},
            ],
            "correct_answer": {
                "ordered_ids": ["greet_wb_02_hasta", "greet_wb_02_luego"]
            },
            "metadata": {"hint": "A casual way to say goodbye.", "difficulty": 2},
        },
        # Match pairs (2)
        {
            "order_index": 5,
            "type": "match_pairs",
            "prompt": "Match the Spanish greetings with their meanings.",
            "audio_url": None,
            "options": {
                "left": [
                    {"id": "greet_match_01_l1", "text": "gracias"},
                    {"id": "greet_match_01_l2", "text": "por favor"},
                    {"id": "greet_match_01_l3", "text": "adiós"},
                ],
                "right": [
                    {"id": "greet_match_01_r1", "text": "thank you"},
                    {"id": "greet_match_01_r2", "text": "please"},
                    {"id": "greet_match_01_r3", "text": "goodbye"},
                ],
            },
            "correct_answer": {
                "pairs": [
                    {"left_id": "greet_match_01_l1", "right_id": "greet_match_01_r1"},
                    {"left_id": "greet_match_01_l2", "right_id": "greet_match_01_r2"},
                    {"left_id": "greet_match_01_l3", "right_id": "greet_match_01_r3"},
                ]
            },
            "metadata": {"hint": "Common polite expressions.", "difficulty": 1},
        },
        {
            "order_index": 6,
            "type": "match_pairs",
            "prompt": "Match the times of day with their greetings.",
            "audio_url": None,
            "options": {
                "left": [
                    {"id": "greet_match_02_l1", "text": "buenos días"},
                    {"id": "greet_match_02_l2", "text": "buenas tardes"},
                    {"id": "greet_match_02_l3", "text": "buenas noches"},
                ],
                "right": [
                    {"id": "greet_match_02_r1", "text": "good morning"},
                    {"id": "greet_match_02_r2", "text": "good afternoon"},
                    {"id": "greet_match_02_r3", "text": "good night"},
                ],
            },
            "correct_answer": {
                "pairs": [
                    {"left_id": "greet_match_02_l1", "right_id": "greet_match_02_r1"},
                    {"left_id": "greet_match_02_l2", "right_id": "greet_match_02_r2"},
                    {"left_id": "greet_match_02_l3", "right_id": "greet_match_02_r3"},
                ]
            },
            "metadata": {"hint": "Consider what time of day each is used.", "difficulty": 1},
        },
        # Fill blank (2)
        {
            "order_index": 7,
            "type": "fill_blank",
            "prompt": "Mucho ___",
            "audio_url": None,
            "options": None,
            "correct_answer": {"text": "gusto"},
            "metadata": {"hint": "Said when meeting someone.", "difficulty": 2},
        },
        {
            "order_index": 8,
            "type": "fill_blank",
            "prompt": "___ luego",
            "audio_url": None,
            "options": None,
            "correct_answer": {"text": "Hasta"},
            "metadata": {"hint": "Means 'see you later'.", "difficulty": 2},
        },
        # Type answer (3)
        {
            "order_index": 9,
            "type": "type_answer",
            "prompt": "Translate 'goodbye' to Spanish.",
            "audio_url": None,
            "options": None,
            "correct_answer": {"accepted": ["adiós", "adios"]},
            "metadata": {"hint": "A farewell expression.", "difficulty": 1},
        },
        {
            "order_index": 10,
            "type": "type_answer",
            "prompt": "How do you say 'hello' in Spanish?",
            "audio_url": None,
            "options": None,
            "correct_answer": {"accepted": ["hola"]},
            "metadata": {"hint": "The most basic greeting.", "difficulty": 1},
        },
        {
            "order_index": 11,
            "type": "type_answer",
            "prompt": "Translate 'nice to meet you' to Spanish.",
            "audio_url": None,
            "options": None,
            "correct_answer": {"accepted": ["mucho gusto"]},
            "metadata": {"hint": "Said during introductions.", "difficulty": 2},
        },
    ]


def _get_basics_exercises() -> list[dict[str, Any]]:
    """Basics skill exercises."""
    return [
        # Multiple choice (3)
        {
            "order_index": 0,
            "type": "multiple_choice",
            "prompt": "How do you say 'I am' in Spanish?",
            "audio_url": None,
            "options": [
                {"id": "basic_mc_01_a", "text": "soy"},
                {"id": "basic_mc_01_b", "text": "eres"},
                {"id": "basic_mc_01_c", "text": "es"},
            ],
            "correct_answer": {"option_id": "basic_mc_01_a"},
            "metadata": {"hint": "First person form of ser.", "difficulty": 1},
        },
        {
            "order_index": 1,
            "type": "multiple_choice",
            "prompt": "What does 'tú' mean?",
            "audio_url": None,
            "options": [
                {"id": "basic_mc_02_a", "text": "I"},
                {"id": "basic_mc_02_b", "text": "you"},
                {"id": "basic_mc_02_c", "text": "he"},
                {"id": "basic_mc_02_d", "text": "she"},
            ],
            "correct_answer": {"option_id": "basic_mc_02_b"},
            "metadata": {"hint": "Informal second person pronoun.", "difficulty": 1},
        },
        {
            "order_index": 2,
            "type": "multiple_choice",
            "prompt": "Which is the masculine singular article?",
            "audio_url": None,
            "options": [
                {"id": "basic_mc_03_a", "text": "la"},
                {"id": "basic_mc_03_b", "text": "el"},
                {"id": "basic_mc_03_c", "text": "una"},
            ],
            "correct_answer": {"option_id": "basic_mc_03_b"},
            "metadata": {"hint": "Definite article for masculine nouns.", "difficulty": 1},
        },
        # Translate word bank (2)
        {
            "order_index": 3,
            "type": "translate_word_bank",
            "prompt": "Build: 'I am a student' (using 'estudiante')",
            "audio_url": None,
            "options": [
                {"id": "basic_wb_01_yo", "text": "Yo"},
                {"id": "basic_wb_01_soy", "text": "soy"},
                {"id": "basic_wb_01_un", "text": "un"},
                {"id": "basic_wb_01_est", "text": "estudiante"},
                {"id": "basic_wb_01_eres", "text": "eres"},
            ],
            "correct_answer": {
                "ordered_ids": ["basic_wb_01_yo", "basic_wb_01_soy", "basic_wb_01_un", "basic_wb_01_est"]
            },
            "metadata": {"hint": "Start with the subject pronoun.", "difficulty": 2},
        },
        {
            "order_index": 4,
            "type": "translate_word_bank",
            "prompt": "Build: 'You are a friend' (using 'amigo')",
            "audio_url": None,
            "options": [
                {"id": "basic_wb_02_tu", "text": "Tú"},
                {"id": "basic_wb_02_eres", "text": "eres"},
                {"id": "basic_wb_02_un", "text": "un"},
                {"id": "basic_wb_02_amigo", "text": "amigo"},
                {"id": "basic_wb_02_soy", "text": "soy"},
            ],
            "correct_answer": {
                "ordered_ids": ["basic_wb_02_tu", "basic_wb_02_eres", "basic_wb_02_un", "basic_wb_02_amigo"]
            },
            "metadata": {"hint": "Tú takes a different verb form.", "difficulty": 2},
        },
        # Match pairs (2)
        {
            "order_index": 5,
            "type": "match_pairs",
            "prompt": "Match the Spanish pronouns with their meanings.",
            "audio_url": None,
            "options": {
                "left": [
                    {"id": "basic_match_01_l1", "text": "yo"},
                    {"id": "basic_match_01_l2", "text": "tú"},
                    {"id": "basic_match_01_l3", "text": "él"},
                    {"id": "basic_match_01_l4", "text": "ella"},
                ],
                "right": [
                    {"id": "basic_match_01_r1", "text": "I"},
                    {"id": "basic_match_01_r2", "text": "you"},
                    {"id": "basic_match_01_r3", "text": "he"},
                    {"id": "basic_match_01_r4", "text": "she"},
                ],
            },
            "correct_answer": {
                "pairs": [
                    {"left_id": "basic_match_01_l1", "right_id": "basic_match_01_r1"},
                    {"left_id": "basic_match_01_l2", "right_id": "basic_match_01_r2"},
                    {"left_id": "basic_match_01_l3", "right_id": "basic_match_01_r3"},
                    {"left_id": "basic_match_01_l4", "right_id": "basic_match_01_r4"},
                ]
            },
            "metadata": {"hint": "Basic subject pronouns.", "difficulty": 1},
        },
        {
            "order_index": 6,
            "type": "match_pairs",
            "prompt": "Match the articles with their types.",
            "audio_url": None,
            "options": {
                "left": [
                    {"id": "basic_match_02_l1", "text": "el"},
                    {"id": "basic_match_02_l2", "text": "la"},
                    {"id": "basic_match_02_l3", "text": "un"},
                    {"id": "basic_match_02_l4", "text": "una"},
                ],
                "right": [
                    {"id": "basic_match_02_r1", "text": "the (masculine)"},
                    {"id": "basic_match_02_r2", "text": "the (feminine)"},
                    {"id": "basic_match_02_r3", "text": "a/an (masculine)"},
                    {"id": "basic_match_02_r4", "text": "a/an (feminine)"},
                ],
            },
            "correct_answer": {
                "pairs": [
                    {"left_id": "basic_match_02_l1", "right_id": "basic_match_02_r1"},
                    {"left_id": "basic_match_02_l2", "right_id": "basic_match_02_r2"},
                    {"left_id": "basic_match_02_l3", "right_id": "basic_match_02_r3"},
                    {"left_id": "basic_match_02_l4", "right_id": "basic_match_02_r4"},
                ]
            },
            "metadata": {"hint": "Spanish articles have gender.", "difficulty": 2},
        },
        # Fill blank (2)
        {
            "order_index": 7,
            "type": "fill_blank",
            "prompt": "Yo ___ estudiante.",
            "audio_url": None,
            "options": None,
            "correct_answer": {"text": "soy"},
            "metadata": {"hint": "Use the verb ser with yo.", "difficulty": 2},
        },
        {
            "order_index": 8,
            "type": "fill_blank",
            "prompt": "Ella ___ profesora.",
            "audio_url": None,
            "options": None,
            "correct_answer": {"text": "es"},
            "metadata": {"hint": "Third person form of ser.", "difficulty": 2},
        },
        # Type answer (3)
        {
            "order_index": 9,
            "type": "type_answer",
            "prompt": "Translate 'I' to Spanish.",
            "audio_url": None,
            "options": None,
            "correct_answer": {"accepted": ["yo"]},
            "metadata": {"hint": "First person singular pronoun.", "difficulty": 1},
        },
        {
            "order_index": 10,
            "type": "type_answer",
            "prompt": "How do you say 'you are' (informal) in Spanish?",
            "audio_url": None,
            "options": None,
            "correct_answer": {"accepted": ["eres"]},
            "metadata": {"hint": "Form of ser for tú.", "difficulty": 2},
        },
        {
            "order_index": 11,
            "type": "type_answer",
            "prompt": "Translate 'he is' to Spanish.",
            "audio_url": None,
            "options": None,
            "correct_answer": {"accepted": ["él es", "el es"]},
            "metadata": {"hint": "Third person masculine.", "difficulty": 2},
        },
    ]


def _get_food_exercises() -> list[dict[str, Any]]:
    """Food skill exercises."""
    return [
        # Multiple choice (3)
        {
            "order_index": 0,
            "type": "multiple_choice",
            "prompt": "What does 'agua' mean?",
            "audio_url": None,
            "options": [
                {"id": "food_mc_01_a", "text": "water"},
                {"id": "food_mc_01_b", "text": "milk"},
                {"id": "food_mc_01_c", "text": "bread"},
                {"id": "food_mc_01_d", "text": "apple"},
            ],
            "correct_answer": {"option_id": "food_mc_01_a"},
            "metadata": {"hint": "Essential for life.", "difficulty": 1},
        },
        {
            "order_index": 1,
            "type": "multiple_choice",
            "prompt": "How do you say 'I eat' in Spanish?",
            "audio_url": None,
            "options": [
                {"id": "food_mc_02_a", "text": "como"},
                {"id": "food_mc_02_b", "text": "bebo"},
                {"id": "food_mc_02_c", "text": "quiero"},
            ],
            "correct_answer": {"option_id": "food_mc_02_a"},
            "metadata": {"hint": "The verb for eating.", "difficulty": 1},
        },
        {
            "order_index": 2,
            "type": "multiple_choice",
            "prompt": "What is 'manzana'?",
            "audio_url": None,
            "options": [
                {"id": "food_mc_03_a", "text": "banana"},
                {"id": "food_mc_03_b", "text": "apple"},
                {"id": "food_mc_03_c", "text": "orange"},
            ],
            "correct_answer": {"option_id": "food_mc_03_b"},
            "metadata": {"hint": "A red or green fruit.", "difficulty": 1},
        },
        # Translate word bank (2)
        {
            "order_index": 3,
            "type": "translate_word_bank",
            "prompt": "Build: 'I drink water'",
            "audio_url": None,
            "options": [
                {"id": "food_wb_01_yo", "text": "Yo"},
                {"id": "food_wb_01_bebo", "text": "bebo"},
                {"id": "food_wb_01_agua", "text": "agua"},
                {"id": "food_wb_01_pan", "text": "pan"},
            ],
            "correct_answer": {
                "ordered_ids": ["food_wb_01_yo", "food_wb_01_bebo", "food_wb_01_agua"]
            },
            "metadata": {"hint": "Start with the subject.", "difficulty": 2},
        },
        {
            "order_index": 4,
            "type": "translate_word_bank",
            "prompt": "Build: 'I want milk'",
            "audio_url": None,
            "options": [
                {"id": "food_wb_02_yo", "text": "Yo"},
                {"id": "food_wb_02_quiero", "text": "quiero"},
                {"id": "food_wb_02_leche", "text": "leche"},
                {"id": "food_wb_02_agua", "text": "agua"},
            ],
            "correct_answer": {
                "ordered_ids": ["food_wb_02_yo", "food_wb_02_quiero", "food_wb_02_leche"]
            },
            "metadata": {"hint": "Use the verb querer.", "difficulty": 2},
        },
        # Match pairs (2)
        {
            "order_index": 5,
            "type": "match_pairs",
            "prompt": "Match the Spanish food words with their meanings.",
            "audio_url": None,
            "options": {
                "left": [
                    {"id": "food_match_01_l1", "text": "pan"},
                    {"id": "food_match_01_l2", "text": "leche"},
                    {"id": "food_match_01_l3", "text": "manzana"},
                ],
                "right": [
                    {"id": "food_match_01_r1", "text": "bread"},
                    {"id": "food_match_01_r2", "text": "milk"},
                    {"id": "food_match_01_r3", "text": "apple"},
                ],
            },
            "correct_answer": {
                "pairs": [
                    {"left_id": "food_match_01_l1", "right_id": "food_match_01_r1"},
                    {"left_id": "food_match_01_l2", "right_id": "food_match_01_r2"},
                    {"left_id": "food_match_01_l3", "right_id": "food_match_01_r3"},
                ]
            },
            "metadata": {"hint": "Common foods.", "difficulty": 1},
        },
        {
            "order_index": 6,
            "type": "match_pairs",
            "prompt": "Match the Spanish verbs with their meanings.",
            "audio_url": None,
            "options": {
                "left": [
                    {"id": "food_match_02_l1", "text": "comer"},
                    {"id": "food_match_02_l2", "text": "beber"},
                    {"id": "food_match_02_l3", "text": "querer"},
                ],
                "right": [
                    {"id": "food_match_02_r1", "text": "to eat"},
                    {"id": "food_match_02_r2", "text": "to drink"},
                    {"id": "food_match_02_r3", "text": "to want"},
                ],
            },
            "correct_answer": {
                "pairs": [
                    {"left_id": "food_match_02_l1", "right_id": "food_match_02_r1"},
                    {"left_id": "food_match_02_l2", "right_id": "food_match_02_r2"},
                    {"left_id": "food_match_02_l3", "right_id": "food_match_02_r3"},
                ]
            },
            "metadata": {"hint": "Food-related verbs.", "difficulty": 1},
        },
        # Fill blank (2)
        {
            "order_index": 7,
            "type": "fill_blank",
            "prompt": "Yo ___ pan.",
            "audio_url": None,
            "options": None,
            "correct_answer": {"text": "como"},
            "metadata": {"hint": "The verb for eating.", "difficulty": 2},
        },
        {
            "order_index": 8,
            "type": "fill_blank",
            "prompt": "Yo bebo ___.",
            "audio_url": None,
            "options": None,
            "correct_answer": {"text": "agua"},
            "metadata": {"hint": "A common drink.", "difficulty": 2},
        },
        # Type answer (3)
        {
            "order_index": 9,
            "type": "type_answer",
            "prompt": "Translate 'bread' to Spanish.",
            "audio_url": None,
            "options": None,
            "correct_answer": {"accepted": ["pan"]},
            "metadata": {"hint": "A staple food.", "difficulty": 1},
        },
        {
            "order_index": 10,
            "type": "type_answer",
            "prompt": "How do you say 'I drink' in Spanish?",
            "audio_url": None,
            "options": None,
            "correct_answer": {"accepted": ["bebo"]},
            "metadata": {"hint": "First person of beber.", "difficulty": 2},
        },
        {
            "order_index": 11,
            "type": "type_answer",
            "prompt": "Translate 'milk' to Spanish.",
            "audio_url": None,
            "options": None,
            "correct_answer": {"accepted": ["leche"]},
            "metadata": {"hint": "A dairy drink.", "difficulty": 1},
        },
    ]


def _get_family_exercises() -> list[dict[str, Any]]:
    """Family skill exercises."""
    return [
        # Multiple choice (3)
        {
            "order_index": 0,
            "type": "multiple_choice",
            "prompt": "What does 'madre' mean?",
            "audio_url": None,
            "options": [
                {"id": "fam_mc_01_a", "text": "mother"},
                {"id": "fam_mc_01_b", "text": "father"},
                {"id": "fam_mc_01_c", "text": "sister"},
                {"id": "fam_mc_01_d", "text": "brother"},
            ],
            "correct_answer": {"option_id": "fam_mc_01_a"},
            "metadata": {"hint": "Female parent.", "difficulty": 1},
        },
        {
            "order_index": 1,
            "type": "multiple_choice",
            "prompt": "How do you say 'brother' in Spanish?",
            "audio_url": None,
            "options": [
                {"id": "fam_mc_02_a", "text": "hermana"},
                {"id": "fam_mc_02_b", "text": "hermano"},
                {"id": "fam_mc_02_c", "text": "hijo"},
            ],
            "correct_answer": {"option_id": "fam_mc_02_b"},
            "metadata": {"hint": "Male sibling.", "difficulty": 1},
        },
        {
            "order_index": 2,
            "type": "multiple_choice",
            "prompt": "What is 'familia' in English?",
            "audio_url": None,
            "options": [
                {"id": "fam_mc_03_a", "text": "friend"},
                {"id": "fam_mc_03_b", "text": "family"},
                {"id": "fam_mc_03_c", "text": "home"},
            ],
            "correct_answer": {"option_id": "fam_mc_03_b"},
            "metadata": {"hint": "A cognate word.", "difficulty": 1},
        },
        # Translate word bank (2)
        {
            "order_index": 3,
            "type": "translate_word_bank",
            "prompt": "Build: 'My mother'",
            "audio_url": None,
            "options": [
                {"id": "fam_wb_01_mi", "text": "Mi"},
                {"id": "fam_wb_01_madre", "text": "madre"},
                {"id": "fam_wb_01_padre", "text": "padre"},
                {"id": "fam_wb_01_tu", "text": "tu"},
            ],
            "correct_answer": {
                "ordered_ids": ["fam_wb_01_mi", "fam_wb_01_madre"]
            },
            "metadata": {"hint": "Start with the possessive.", "difficulty": 2},
        },
        {
            "order_index": 4,
            "type": "translate_word_bank",
            "prompt": "Build: 'She is my sister'",
            "audio_url": None,
            "options": [
                {"id": "fam_wb_02_ella", "text": "Ella"},
                {"id": "fam_wb_02_es", "text": "es"},
                {"id": "fam_wb_02_mi", "text": "mi"},
                {"id": "fam_wb_02_hermana", "text": "hermana"},
                {"id": "fam_wb_02_hermano", "text": "hermano"},
            ],
            "correct_answer": {
                "ordered_ids": ["fam_wb_02_ella", "fam_wb_02_es", "fam_wb_02_mi", "fam_wb_02_hermana"]
            },
            "metadata": {"hint": "Subject, verb, possessive, noun.", "difficulty": 2},
        },
        # Match pairs (2)
        {
            "order_index": 5,
            "type": "match_pairs",
            "prompt": "Match the Spanish family words with their meanings.",
            "audio_url": None,
            "options": {
                "left": [
                    {"id": "fam_match_01_l1", "text": "padre"},
                    {"id": "fam_match_01_l2", "text": "hijo"},
                    {"id": "fam_match_01_l3", "text": "hija"},
                ],
                "right": [
                    {"id": "fam_match_01_r1", "text": "father"},
                    {"id": "fam_match_01_r2", "text": "son"},
                    {"id": "fam_match_01_r3", "text": "daughter"},
                ],
            },
            "correct_answer": {
                "pairs": [
                    {"left_id": "fam_match_01_l1", "right_id": "fam_match_01_r1"},
                    {"left_id": "fam_match_01_l2", "right_id": "fam_match_01_r2"},
                    {"left_id": "fam_match_01_l3", "right_id": "fam_match_01_r3"},
                ]
            },
            "metadata": {"hint": "Parents and children.", "difficulty": 1},
        },
        {
            "order_index": 6,
            "type": "match_pairs",
            "prompt": "Match the Spanish words with their meanings.",
            "audio_url": None,
            "options": {
                "left": [
                    {"id": "fam_match_02_l1", "text": "hermano"},
                    {"id": "fam_match_02_l2", "text": "hermana"},
                    {"id": "fam_match_02_l3", "text": "familia"},
                ],
                "right": [
                    {"id": "fam_match_02_r1", "text": "brother"},
                    {"id": "fam_match_02_r2", "text": "sister"},
                    {"id": "fam_match_02_r3", "text": "family"},
                ],
            },
            "correct_answer": {
                "pairs": [
                    {"left_id": "fam_match_02_l1", "right_id": "fam_match_02_r1"},
                    {"left_id": "fam_match_02_l2", "right_id": "fam_match_02_r2"},
                    {"left_id": "fam_match_02_l3", "right_id": "fam_match_02_r3"},
                ]
            },
            "metadata": {"hint": "Siblings and family.", "difficulty": 1},
        },
        # Fill blank (2)
        {
            "order_index": 7,
            "type": "fill_blank",
            "prompt": "Ella es mi ___.",
            "audio_url": None,
            "options": None,
            "correct_answer": {"text": "hermana"},
            "metadata": {"hint": "Female sibling.", "difficulty": 2},
        },
        {
            "order_index": 8,
            "type": "fill_blank",
            "prompt": "Mi ___ es Juan.",
            "audio_url": None,
            "options": None,
            "correct_answer": {"text": "padre"},
            "metadata": {"hint": "Male parent.", "difficulty": 2},
        },
        # Type answer (3)
        {
            "order_index": 9,
            "type": "type_answer",
            "prompt": "Translate 'mother' to Spanish.",
            "audio_url": None,
            "options": None,
            "correct_answer": {"accepted": ["madre"]},
            "metadata": {"hint": "Female parent.", "difficulty": 1},
        },
        {
            "order_index": 10,
            "type": "type_answer",
            "prompt": "How do you say 'son' in Spanish?",
            "audio_url": None,
            "options": None,
            "correct_answer": {"accepted": ["hijo"]},
            "metadata": {"hint": "Male child.", "difficulty": 1},
        },
        {
            "order_index": 11,
            "type": "type_answer",
            "prompt": "Translate 'my sister' to Spanish.",
            "audio_url": None,
            "options": None,
            "correct_answer": {"accepted": ["mi hermana"]},
            "metadata": {"hint": "Possessive plus noun.", "difficulty": 2},
        },
    ]


def _get_questions_exercises() -> list[dict[str, Any]]:
    """Questions skill exercises."""
    return [
        # Multiple choice (3)
        {
            "order_index": 0,
            "type": "multiple_choice",
            "prompt": "What does '¿Cómo estás?' mean?",
            "audio_url": None,
            "options": [
                {"id": "quest_mc_01_a", "text": "How are you?"},
                {"id": "quest_mc_01_b", "text": "What is this?"},
                {"id": "quest_mc_01_c", "text": "Where is it?"},
            ],
            "correct_answer": {"option_id": "quest_mc_01_a"},
            "metadata": {"hint": "A common greeting question.", "difficulty": 1},
        },
        {
            "order_index": 1,
            "type": "multiple_choice",
            "prompt": "How do you ask 'what is this?' in Spanish?",
            "audio_url": None,
            "options": [
                {"id": "quest_mc_02_a", "text": "¿Quién es?"},
                {"id": "quest_mc_02_b", "text": "¿Qué es esto?"},
                {"id": "quest_mc_02_c", "text": "¿Dónde está?"},
            ],
            "correct_answer": {"option_id": "quest_mc_02_b"},
            "metadata": {"hint": "Asking about an object.", "difficulty": 2},
        },
        {
            "order_index": 2,
            "type": "multiple_choice",
            "prompt": "What does '¿Quién?' mean?",
            "audio_url": None,
            "options": [
                {"id": "quest_mc_03_a", "text": "What"},
                {"id": "quest_mc_03_b", "text": "Who"},
                {"id": "quest_mc_03_c", "text": "When"},
                {"id": "quest_mc_03_d", "text": "Where"},
            ],
            "correct_answer": {"option_id": "quest_mc_03_b"},
            "metadata": {"hint": "Asking about a person.", "difficulty": 1},
        },
        # Translate word bank (2)
        {
            "order_index": 3,
            "type": "translate_word_bank",
            "prompt": "Build: 'Where is it?'",
            "audio_url": None,
            "options": [
                {"id": "quest_wb_01_donde", "text": "¿Dónde"},
                {"id": "quest_wb_01_esta", "text": "está?"},
                {"id": "quest_wb_01_como", "text": "¿Cómo"},
                {"id": "quest_wb_01_que", "text": "¿Qué"},
            ],
            "correct_answer": {
                "ordered_ids": ["quest_wb_01_donde", "quest_wb_01_esta"]
            },
            "metadata": {"hint": "Asking about location.", "difficulty": 2},
        },
        {
            "order_index": 4,
            "type": "translate_word_bank",
            "prompt": "Build: 'Who is he?'",
            "audio_url": None,
            "options": [
                {"id": "quest_wb_02_quien", "text": "¿Quién"},
                {"id": "quest_wb_02_es", "text": "es"},
                {"id": "quest_wb_02_el", "text": "él?"},
                {"id": "quest_wb_02_donde", "text": "¿Dónde"},
            ],
            "correct_answer": {
                "ordered_ids": ["quest_wb_02_quien", "quest_wb_02_es", "quest_wb_02_el"]
            },
            "metadata": {"hint": "Asking about identity.", "difficulty": 2},
        },
        # Match pairs (2)
        {
            "order_index": 5,
            "type": "match_pairs",
            "prompt": "Match the Spanish question words with their meanings.",
            "audio_url": None,
            "options": {
                "left": [
                    {"id": "quest_match_01_l1", "text": "¿Qué?"},
                    {"id": "quest_match_01_l2", "text": "¿Quién?"},
                    {"id": "quest_match_01_l3", "text": "¿Dónde?"},
                ],
                "right": [
                    {"id": "quest_match_01_r1", "text": "What?"},
                    {"id": "quest_match_01_r2", "text": "Who?"},
                    {"id": "quest_match_01_r3", "text": "Where?"},
                ],
            },
            "correct_answer": {
                "pairs": [
                    {"left_id": "quest_match_01_l1", "right_id": "quest_match_01_r1"},
                    {"left_id": "quest_match_01_l2", "right_id": "quest_match_01_r2"},
                    {"left_id": "quest_match_01_l3", "right_id": "quest_match_01_r3"},
                ]
            },
            "metadata": {"hint": "Basic question words.", "difficulty": 1},
        },
        {
            "order_index": 6,
            "type": "match_pairs",
            "prompt": "Match the Spanish questions with their meanings.",
            "audio_url": None,
            "options": {
                "left": [
                    {"id": "quest_match_02_l1", "text": "¿Cómo?"},
                    {"id": "quest_match_02_l2", "text": "¿Cuándo?"},
                    {"id": "quest_match_02_l3", "text": "¿Por qué?"},
                ],
                "right": [
                    {"id": "quest_match_02_r1", "text": "How?"},
                    {"id": "quest_match_02_r2", "text": "When?"},
                    {"id": "quest_match_02_r3", "text": "Why?"},
                ],
            },
            "correct_answer": {
                "pairs": [
                    {"left_id": "quest_match_02_l1", "right_id": "quest_match_02_r1"},
                    {"left_id": "quest_match_02_l2", "right_id": "quest_match_02_r2"},
                    {"left_id": "quest_match_02_l3", "right_id": "quest_match_02_r3"},
                ]
            },
            "metadata": {"hint": "More question words.", "difficulty": 2},
        },
        # Fill blank (2)
        {
            "order_index": 7,
            "type": "fill_blank",
            "prompt": "¿___ estás?",
            "audio_url": None,
            "options": None,
            "correct_answer": {"text": "Cómo"},
            "metadata": {"hint": "Asking 'How are you?'", "difficulty": 2},
        },
        {
            "order_index": 8,
            "type": "fill_blank",
            "prompt": "¿___ es esto?",
            "audio_url": None,
            "options": None,
            "correct_answer": {"text": "Qué"},
            "metadata": {"hint": "Asking 'What is this?'", "difficulty": 2},
        },
        # Type answer (3)
        {
            "order_index": 9,
            "type": "type_answer",
            "prompt": "Translate 'where' to Spanish (as a question word).",
            "audio_url": None,
            "options": None,
            "correct_answer": {"accepted": ["dónde", "donde"]},
            "metadata": {"hint": "Asking about location.", "difficulty": 1},
        },
        {
            "order_index": 10,
            "type": "type_answer",
            "prompt": "How do you say 'when' in Spanish?",
            "audio_url": None,
            "options": None,
            "correct_answer": {"accepted": ["cuándo", "cuando"]},
            "metadata": {"hint": "Asking about time.", "difficulty": 1},
        },
        {
            "order_index": 11,
            "type": "type_answer",
            "prompt": "Translate 'How are you?' to Spanish (informal).",
            "audio_url": None,
            "options": None,
            "correct_answer": {"accepted": ["¿Cómo estás?", "Como estás?", "como estas", "Cómo estás"]},
            "metadata": {"hint": "A common greeting.", "difficulty": 2},
        },
    ]


def get_achievements_definition() -> list[dict[str, Any]]:
    """Return achievement definitions."""
    return [
        {
            "key": "first_steps",
            "title": "First Steps",
            "description": "Complete your first skill.",
            "icon": "footprints",
            "criteria_type": "skills_completed",
            "criteria_value": 1,
        },
        {
            "key": "streak_3",
            "title": "Building Momentum",
            "description": "Learn for three days in a row.",
            "icon": "small-flame",
            "criteria_type": "streak_days",
            "criteria_value": 3,
        },
        {
            "key": "streak_7",
            "title": "A Full Week",
            "description": "Reach a seven-day learning streak.",
            "icon": "calendar-star",
            "criteria_type": "streak_days",
            "criteria_value": 7,
        },
        {
            "key": "xp_100",
            "title": "XP Explorer",
            "description": "Earn 100 total XP.",
            "icon": "xp-spark",
            "criteria_type": "total_xp",
            "criteria_value": 100,
        },
        {
            "key": "xp_500",
            "title": "XP Trailblazer",
            "description": "Earn 500 total XP.",
            "icon": "xp-crown",
            "criteria_type": "total_xp",
            "criteria_value": 500,
        },
        {
            "key": "perfectionist",
            "title": "Perfectionist",
            "description": "Complete five lessons without a mistake.",
            "icon": "target-star",
            "criteria_type": "perfect_lessons",
            "criteria_value": 5,
        },
    ]
