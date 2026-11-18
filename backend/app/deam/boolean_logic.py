import re
from typing import Any, Dict, List, Set


def extract_variables(expr: str) -> List[str]:
    """Extract distinct single-letter Boolean variable names in alphabetical order."""
    # Matches individual uppercase letters that aren't part of keywords (AND, OR, NOT, XOR, XNOR)
    cleaned = re.sub(r"\b(AND|OR|NOT|XOR|XNOR)\b", " ", expr, flags=re.IGNORECASE)
    tokens = re.findall(r"[A-Za-z]", cleaned)
    vars_set: Set[str] = {t.upper() for t in tokens}
    return sorted(list(vars_set))


def normalize_expression(expr: str) -> str:
    """Translate human-written Boolean expression symbols into valid Python boolean syntax."""
    s = expr.strip()

    # Replace mathematical or engineering symbols
    s = s.replace("·", " and ").replace("*", " and ")
    s = s.replace("+", " or ")
    s = s.replace("⊕", " ^ ")
    s = s.replace("¬", " not ").replace("!", " not ").replace("~", " not ")

    # Normalize words case-insensitively
    s = re.sub(r"\bXOR\b", "^", s, flags=re.IGNORECASE)
    s = re.sub(r"\bAND\b", "and", s, flags=re.IGNORECASE)
    s = re.sub(r"\bOR\b", "or", s, flags=re.IGNORECASE)
    s = re.sub(r"\bNOT\b", "not", s, flags=re.IGNORECASE)

    return s


def evaluate_expression(expr: str, variable_values: Dict[str, int]) -> int:
    """Safely evaluate Boolean expression for a given variable assignment dictionary."""
    norm = normalize_expression(expr)

    # Prepare safe local namespace
    allowed_locals: Dict[str, Any] = {}
    for var, val in variable_values.items():
        allowed_locals[var.upper()] = bool(val)
        allowed_locals[var.lower()] = bool(val)

    # Disallow builtins and dunder attributes for safety
    try:
        result = eval(norm, {"__builtins__": {}}, allowed_locals)
        return 1 if bool(result) else 0
    except Exception as e:
        raise ValueError(f"Failed to evaluate expression '{expr}': {str(e)}")


def generate_expression_truth_table(expr: str) -> Dict[str, Any]:
    """Generate truth table for arbitrary Boolean expression."""
    variables = extract_variables(expr)
    if not variables:
        raise ValueError("Expression does not contain any variables (e.g. A, B, C).")
    if len(variables) > 6:
        raise ValueError("Expressions with more than 6 variables are restricted for performance.")

    num_rows = 1 << len(variables)
    rows: List[Dict[str, int]] = []

    for i in range(num_rows):
        assignment: Dict[str, int] = {}
        # Assign bit values in standard binary order
        for idx, var in enumerate(variables):
            bit_pos = len(variables) - 1 - idx
            assignment[var] = (i >> bit_pos) & 1

        val = evaluate_expression(expr, assignment)
        row = {**assignment, "OUTPUT": val}
        rows.append(row)

    minterms = [i for i, r in enumerate(rows) if r["OUTPUT"] == 1]
    maxterms = [i for i, r in enumerate(rows) if r["OUTPUT"] == 0]

    return {
        "expression": expr,
        "variables": variables,
        "table": rows,
        "minterms": minterms,
        "maxterms": maxterms,
    }


def get_boolean_identities() -> List[Dict[str, str]]:
    """Return catalog of foundational Boolean algebra laws and identities."""
    return [
        {"law": "Identity Law", "and_form": "A · 1 = A", "or_form": "A + 0 = A"},
        {"law": "Null / Annulment Law", "and_form": "A · 0 = 0", "or_form": "A + 1 = 1"},
        {"law": "Idempotent Law", "and_form": "A · A = A", "or_form": "A + A = A"},
        {"law": "Inverse / Complement Law", "and_form": "A · ¬A = 0", "or_form": "A + ¬A = 1"},
        {"law": "Double Negation", "and_form": "¬(¬A) = A", "or_form": "¬(¬A) = A"},
        {"law": "Commutative Law", "and_form": "A · B = B · A", "or_form": "A + B = B + A"},
        {"law": "Associative Law", "and_form": "(A · B) · C = A · (B · C)", "or_form": "(A + B) + C = A + (B + C)"},
        {"law": "Distributive Law", "and_form": "A · (B + C) = (A · B) + (A · C)", "or_form": "A + (B · C) = (A + B) · (A + C)"},
        {"law": "Absorption Law", "and_form": "A · (A + B) = A", "or_form": "A + (A · B) = A"},
        {"law": "De Morgan's First Law", "and_form": "¬(A · B) = ¬A + ¬B", "or_form": "--"},
        {"law": "De Morgan's Second Law", "and_form": "--", "or_form": "¬(A + B) = ¬A · ¬B"},
    ]
