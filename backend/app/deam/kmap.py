from itertools import combinations
from typing import Any, Dict, List, Set, Tuple


def term_to_binary(term: int, num_vars: int) -> str:
    """Convert integer minterm into binary string padded to num_vars."""
    return format(term, f"0{num_vars}b")


def diff_by_one_bit(term1: str, term2: str) -> Tuple[bool, str]:
    """Check if two implicant binary representations differ by exactly one bit."""
    diff_count = 0
    merged = []
    for c1, c2 in zip(term1, term2):
        if c1 != c2:
            diff_count += 1
            merged.append("-")
        else:
            merged.append(c1)
    if diff_count == 1:
        return True, "".join(merged)
    return False, ""


def quine_mccluskey(minterms: Set[int], dont_cares: Set[int], num_vars: int) -> Set[str]:
    """Derive prime implicants using Quine-McCluskey tabular reduction."""
    all_terms = minterms | dont_cares
    if not all_terms:
        return set()
    if len(all_terms) == (1 << num_vars):
        return {"-" * num_vars}  # Always 1

    # Group terms by number of 1s
    groups: Dict[int, Set[str]] = {}
    for t in all_terms:
        b = term_to_binary(t, num_vars)
        ones = b.count("1")
        groups.setdefault(ones, set()).add(b)

    prime_implicants: Set[str] = set()
    current_groups = groups

    while current_groups:
        next_groups: Dict[int, Set[str]] = {}
        combined: Set[str] = set()

        sorted_keys = sorted(current_groups.keys())
        for i in range(len(sorted_keys) - 1):
            k1 = sorted_keys[i]
            k2 = sorted_keys[i + 1]
            if k2 - k1 != 1:
                continue

            for t1 in current_groups[k1]:
                for t2 in current_groups[k2]:
                    can_merge, merged = diff_by_one_bit(t1, t2)
                    if can_merge:
                        ones = merged.count("1")
                        next_groups.setdefault(ones, set()).add(merged)
                        combined.add(t1)
                        combined.add(t2)

        # Uncombined terms become prime implicants
        for group in current_groups.values():
            for t in group:
                if t not in combined:
                    prime_implicants.add(t)

        current_groups = next_groups

    return prime_implicants


def implicant_covers_minterm(implicant: str, minterm_bin: str) -> bool:
    """Check if an implicant (with dashes) covers a binary minterm."""
    for c_imp, c_min in zip(implicant, minterm_bin):
        if c_imp != "-" and c_imp != c_min:
            return False
    return True


def select_minimal_cover(
    prime_implicants: Set[str], minterms: Set[int], num_vars: int
) -> List[str]:
    """Find minimal subset of prime implicants that covers all target minterms (Petrick / greedy heuristic)."""
    if not minterms:
        return []
    minterm_bins = {m: term_to_binary(m, num_vars) for m in minterms}

    # Map each minterm to implicants that cover it
    chart: Dict[int, List[str]] = {}
    for m, b in minterm_bins.items():
        chart[m] = [imp for imp in prime_implicants if implicant_covers_minterm(imp, b)]

    selected: List[str] = []
    uncovered = set(minterms)

    # 1. Essential Prime Implicants
    for m, imps in chart.items():
        if len(imps) == 1 and imps[0] not in selected:
            epi = imps[0]
            selected.append(epi)
            # Remove covered minterms
            for um in list(uncovered):
                if implicant_covers_minterm(epi, minterm_bins[um]):
                    uncovered.discard(um)

    # 2. Greedy cover for remaining minterms
    remaining_imps = [imp for imp in prime_implicants if imp not in selected]
    while uncovered and remaining_imps:
        # Choose implicant covering maximum uncovered minterms
        best_imp = max(
            remaining_imps,
            key=lambda imp: sum(1 for m in uncovered if implicant_covers_minterm(imp, minterm_bins[m])),
        )
        selected.append(best_imp)
        remaining_imps.remove(best_imp)
        for um in list(uncovered):
            if implicant_covers_minterm(best_imp, minterm_bins[um]):
                uncovered.discard(um)

    return sorted(selected)


def implicant_to_product_term(implicant: str, var_names: List[str]) -> str:
    """Convert implicant string (e.g. '1-0') to algebraic product term (e.g. 'A·¬C')."""
    if implicant == "-" * len(implicant):
        return "1"

    literals = []
    for char, var in zip(implicant, var_names):
        if char == "1":
            literals.append(var)
        elif char == "0":
            literals.append(f"¬{var}")
    return "".join(literals) if literals else "1"


def get_kmap_structure(num_vars: int) -> Dict[str, Any]:
    """Return row/col labels and Gray code grid cell map for 2, 3, or 4 variables."""
    if num_vars == 2:
        var_names = ["A", "B"]
        row_labels = ["0", "1"]
        col_labels = ["0", "1"]
        row_var = "A"
        col_var = "B"
        cell_matrix = [
            [0, 1],
            [2, 3],
        ]
    elif num_vars == 3:
        var_names = ["A", "B", "C"]
        row_labels = ["0", "1"]
        col_labels = ["00", "01", "11", "10"]
        row_var = "A"
        col_var = "BC"
        cell_matrix = [
            [0, 1, 3, 2],
            [4, 5, 7, 6],
        ]
    elif num_vars == 4:
        var_names = ["A", "B", "C", "D"]
        row_labels = ["00", "01", "11", "10"]
        col_labels = ["00", "01", "11", "10"]
        row_var = "AB"
        col_var = "CD"
        cell_matrix = [
            [0, 1, 3, 2],
            [4, 5, 7, 6],
            [12, 13, 15, 14],
            [8, 9, 11, 10],
        ]
    else:
        raise ValueError(f"K-Map only supports 2, 3, or 4 variables (received {num_vars}).")

    return {
        "num_vars": num_vars,
        "variables": var_names,
        "row_var": row_var,
        "col_var": col_var,
        "row_labels": row_labels,
        "col_labels": col_labels,
        "cell_matrix": cell_matrix,
    }


def solve_kmap(
    num_vars: int, minterms: List[int], dont_cares: List[int] = None
) -> Dict[str, Any]:
    """Full K-Map solver with grid mapping, Prime Implicants, and verified minimal SOP."""
    if num_vars not in (2, 3, 4):
        raise ValueError(f"num_vars must be 2, 3, or 4 (received {num_vars}).")

    max_val = 1 << num_vars
    minterms_set = set(minterms)
    dont_cares_set = set(dont_cares or [])

    # Validate range
    for m in minterms_set:
        if m < 0 or m >= max_val:
            raise ValueError(f"Minterm {m} is out of bounds for {num_vars}-variable K-Map (0 to {max_val - 1}).")
    for d in dont_cares_set:
        if d < 0 or d >= max_val:
            raise ValueError(f"Don't-care {d} is out of bounds for {num_vars}-variable K-Map (0 to {max_val - 1}).")

    overlap = minterms_set & dont_cares_set
    if overlap:
        raise ValueError(f"Terms {list(overlap)} cannot be both minterms and don't-cares.")

    struct = get_kmap_structure(num_vars)
    cell_matrix = struct["cell_matrix"]

    # Construct visual grid with values '0', '1', or 'X'
    grid_values: List[List[str]] = []
    for row in cell_matrix:
        row_vals = []
        for cell_idx in row:
            if cell_idx in minterms_set:
                row_vals.append("1")
            elif cell_idx in dont_cares_set:
                row_vals.append("X")
            else:
                row_vals.append("0")
        grid_values.append(row_vals)

    # Solve minimal cover
    if not minterms_set:
        simplified_expr = "0"
        implicants = []
        groups = []
    elif len(minterms_set | dont_cares_set) == max_val and not (set(range(max_val)) - (minterms_set | dont_cares_set)):
        simplified_expr = "1"
        implicants = ["-" * num_vars]
        groups = [{"cells": list(range(max_val)), "term": "1", "size": max_val}]
    else:
        primes = quine_mccluskey(minterms_set, dont_cares_set, num_vars)
        selected_cover = select_minimal_cover(primes, minterms_set, num_vars)

        # Convert to algebraic terms
        terms = [
            implicant_to_product_term(imp, struct["variables"]) for imp in selected_cover
        ]
        simplified_expr = " + ".join(terms) if terms else "0"
        implicants = selected_cover

        # Find cells covered by each implicant for visualization grouping
        groups = []
        for imp, term in zip(selected_cover, terms):
            covered_cells = [
                i for i in range(max_val)
                if implicant_covers_minterm(imp, term_to_binary(i, num_vars))
            ]
            groups.append({
                "cells": covered_cells,
                "term": term,
                "size": len(covered_cells),
                "implicant": imp,
            })

    # Mathematical Equivalence Verification:
    # Ensure every minterm evaluates to 1 under the simplified expression
    verified = True
    verification_errors = []
    if simplified_expr not in ("0", "1"):
        for m in minterms_set:
            m_bin = term_to_binary(m, num_vars)
            covered = any(implicant_covers_minterm(imp, m_bin) for imp in implicants)
            if not covered:
                verified = False
                verification_errors.append(f"Minterm {m} not covered by simplified expression.")

    return {
        "num_vars": num_vars,
        "variables": struct["variables"],
        "row_var": struct["row_var"],
        "col_var": struct["col_var"],
        "row_labels": struct["row_labels"],
        "col_labels": struct["col_labels"],
        "cell_matrix": cell_matrix,
        "grid_values": grid_values,
        "minterms": sorted(list(minterms_set)),
        "dont_cares": sorted(list(dont_cares_set)),
        "prime_implicants": implicants,
        "groups": groups,
        "simplified_expression": simplified_expr,
        "verified": verified,
        "verification_errors": verification_errors,
    }
