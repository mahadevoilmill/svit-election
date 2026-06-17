#!/usr/bin/env python3
"""Simple vote calculator for member-based elections."""

import re
from collections import Counter


def parse_votes(text):
    tokens = [token.strip() for token in re.split(r"[\s,;]+", text.strip()) if token.strip()]
    votes = []
    for token in tokens:
        try:
            votes.append(int(token))
        except ValueError:
            print(f"Warning: ignored invalid vote '{token}'. Use numbers only.")
    return votes


def get_int(prompt, default=None, min_value=1):
    while True:
        raw = input(f"{prompt}" + (f" [{default}]" if default is not None else "") + ": ").strip()
        if raw == "" and default is not None:
            return default
        if raw.isdigit():
            value = int(raw)
            if value >= min_value:
                return value
        print(f"Please enter a whole number >= {min_value}.")


def display_results(votes, member_count, candidate_count):
    count = Counter(votes)
    print("\nVote counts:")
    for candidate in range(1, candidate_count + 1):
        print(f"Candidate {candidate}: {count[candidate]} votes")

    total_counted = sum(count[candidate] for candidate in range(1, candidate_count + 1))
    if total_counted != member_count:
        print(f"\nNote: {member_count - total_counted} vote(s) were missing or invalid.")

    print("\nPercentages:")
    for candidate in range(1, candidate_count + 1):
        percent = (count[candidate] / member_count) * 100 if member_count else 0
        print(f"Candidate {candidate}: {percent:.2f}%")

    if member_count > 0:
        max_votes = max(count[candidate] for candidate in range(1, candidate_count + 1))
        winners = [str(candidate) for candidate in range(1, candidate_count + 1) if count[candidate] == max_votes]
        print(f"\nWinner(s): Candidate(s) {', '.join(winners)} with {max_votes} vote(s)")


def main():
    print("Simple Vote Calculator")
    member_count = get_int("Enter total number of members", default=50)
    candidate_count = get_int("Enter total number of candidate options", default=17)

    print(f"\nEnter each member's vote as a candidate number from 1 to {candidate_count}.")
    print(f"You need to enter exactly {member_count} votes.")
    print("Separate numbers with spaces, commas, or semicolons.")

    votes = []
    while len(votes) < member_count:
        raw = input(f"Enter votes ({len(votes)}/{member_count} entered): ").strip()
        if raw == "":
            print("Please enter at least one vote.")
            continue
        votes.extend(parse_votes(raw))

    votes = votes[:member_count]
    invalid_votes = [vote for vote in votes if vote < 1 or vote > candidate_count]
    valid_votes = [vote for vote in votes if 1 <= vote <= candidate_count]

    if invalid_votes:
        print(f"\nIgnored invalid vote numbers: {invalid_votes}")

    display_results(valid_votes, member_count, candidate_count)


if __name__ == "__main__":
    main()
