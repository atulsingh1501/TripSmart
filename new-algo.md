tour-split:
40, 35,25,10 - adjustable according to preference - old logic
round trip - more budget on travel, other go down 10-15% overall

stay calculation only round trip:
total days(from and return date) - travel time both from -> to and to -> from

round trip:
if < 1 day stay - ask user if he needs accomodation before showing any options
if > 1 day stay - same interface as now (show both need accomodation and options) - remove option if no accomodations selected

direct travel: ask user for accomodation before showing options

calculation of budget:
a backtracking algorithm which uses the split calcuted from the users choices (refer tour split)

priority based selection:

primary choices more priority -> secondary choices

travel(highest priority) -> accommodation(second highest priority) -> meal(third highest priority) -> activity(fourth highest priority)

travel -> primary choices -> flight(highest priority), train(second highest priority), bus (third highest priority), car rental (fourth highest priority)

make a tree of primary choices of each category with the highest priority as root and the other choices as children

downgrade the choice from the lowest priority child
    upon reaching the lowest priority choice, backtrack to the parent and downgrade the parent
    continue this process until a choice is found which fits the budget

if the budget is too low for any available option, show a warning

and then this algorithm is used for trip selection:

- using the same split calculated from the users choices (refer tour split)
- select the best option from each category which fits the budget
- use the same backtracking approach for this as well, but on all options this time, not the users choices

