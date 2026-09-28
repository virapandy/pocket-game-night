# Scenarios

Plain-English descriptions of how each game must behave. The owner approves them; tests are
written only from approved scenarios. One file per scenario or small group, in `specs/<game>/`.

## Template

```
# TAM-001: Early Five is accepted when five called numbers are marked
Status: draft            (becomes: approved, <owner>, <YYYY-MM-DD>)

Given a ticket with 3 7 21 45 88 in it
And the numbers 3 7 21 45 88 have been called
When the player claims Early Five
Then the host phone accepts the claim
And the room sees "Early Five: accepted"
```

IDs: `TAM-` for Tambola, `PLT-` for behaviour shared by all games (`specs/platform/`). Each new game gets its own prefix.
