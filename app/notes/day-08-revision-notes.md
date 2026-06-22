# Day 8 Revision Notes — SQL Injection

**Roadmap phase:** Foundations
**Connects to:** Day 3 (Networking — TCP handshakes you'll see in traffic), Day 7 (Burp Repeater — where you'll actually run these payloads), Day 16 (Secure Coding — the fix), Day 21 (Advanced Labs)
**Revision date:** _______________

---

## The One Sentence Summary

> SQL injection happens when user input is allowed to become part of a query's *structure* instead of staying confined to its *data* — and once that line is crossed, the attacker is no longer filling out a form, they're writing SQL.

---

## 1. What's Actually Happening, Mechanically

A normal login check, written carelessly, looks like this on the backend:

```python
query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'"
```

If `username` is exactly what the developer expected — a plain word — this works fine. The vulnerability exists because **the database cannot tell the difference between a quote character that's part of someone's name and a quote character that's part of attacker-supplied SQL syntax.** Both arrive as the same kind of text, concatenated into the same string, and by the time the database receives the query, the original intent (data) and the injected intent (code) are indistinguishable.

Submit `admin' --` as the username, and the query becomes:

```sql
SELECT * FROM users WHERE username = 'admin' --' AND password = ''
```

`--` is the SQL comment marker. Everything after it — including the entire password check — is now commented out and never evaluated. The query logs in as admin without ever checking a password, because as far as the database is concerned, there was no password check left to run.

---

## 2. The Five Injection Types — In Depth

### Classic / In-Band Injection
The result of the injection is visible directly in the application's normal response. This is the easiest type to find and confirm — what you typed visibly changed what came back.

### Error-Based Injection
The application leaks a database error message back to the user, and that error message itself contains useful information (table names, column names, database version) even though the attacker never directly saw the underlying data.
```
Example error leaked: "You have an error in your SQL syntax near 'FROM users--' at line 1"
```
This single error tells an attacker the backend is using MySQL syntax and that their injected `FROM users` fragment reached the query — both useful facts for the next attempt.

### UNION-Based Injection
Uses SQL's `UNION SELECT` operator to append a second, attacker-controlled query onto the original one, pulling data from a completely different table into the same response.
```sql
' UNION SELECT username, password FROM users--
```
**The hard requirement for UNION attacks**: the injected `SELECT` must return the exact same number of columns as the original query, or the database will reject it outright. Attackers typically probe for the correct column count first, often using `ORDER BY 1`, `ORDER BY 2`, etc., until the query stops erroring out.

### Blind Boolean-Based Injection
No error message, no visible data difference — but the page's *behavior* changes based on whether the injected condition is true or false (a different page state, a redirect happens or doesn't, content appears or disappears).
```sql
' AND 1=1--   → page behaves normally (true)
' AND 1=2--   → page behaves differently (false)
```
By asking a long sequence of true/false questions this way (`AND SUBSTRING(password,1,1)='a'--`, then `'b'`, then `'c'`...), an attacker can extract data one character at a time without ever seeing an error or a direct result.

### Blind Time-Based Injection
Used when even the page's *behavior* gives no visible signal. The attacker injects a deliberate delay and measures response time instead of response content.
```sql
' OR SLEEP(5)--
```
If the response consistently takes about 5 seconds longer when this payload is sent, the injection point is confirmed — the database executed the `SLEEP()` function, which only happens if the injected SQL actually ran.

---

## 3. Reading the Live Simulator's Three Outcomes

In today's interactive lesson, typing different payloads into the simulated login field produces three categories of response. Understand *why* each one happens, not just what it's labeled:

| What you typed | What happened to the query | Why the database responded that way |
|---|---|---|
| `admin` (plain text) | Stayed entirely inside the intended `WHERE username = '...'` data slot | No structural change to the query — this is what correct behavior looks like |
| `' UNION SELECT username,password FROM users--` | A second, complete `SELECT` statement got appended onto the first | The database genuinely executed two queries and concatenated their results — this is real data leakage, not a simulated guess |
| `admin'--` | The closing quote and `--` terminated the intended string early and commented out the rest of the query | The password check was never evaluated at all — authentication bypass, not a wrong-password scenario |

---

## 4. The Fix — In Depth

### Parameterized Queries (the actual fix, not a mitigation)
```python
# VULNERABLE — string concatenation, data and code mixed together
query = f"SELECT * FROM users WHERE username='{username}'"

# FIXED — parameterized query, data and code kept structurally separate
cursor.execute("SELECT * FROM users WHERE username=%s", (username,))
```
The critical difference: in the parameterized version, the database driver sends the query structure and the user's data as **two separate things** over the wire. The database compiles the query structure first, and only then substitutes the parameter in as a literal value — it is no longer possible for the substituted value to be interpreted as additional SQL syntax, no matter what characters it contains. This isn't input sanitization catching bad characters; it's a structural guarantee that data can never become code.

### Why input validation alone is not sufficient
Blocklisting characters like `'` or keywords like `UNION` is fragile — there are always encoding tricks, alternate syntax, or simply contexts where a legitimate apostrophe (a name like O'Brien) needs to be allowed through. Validation is a reasonable *second* layer of defense, but parameterized queries are the actual fix; never ship the validation layer alone and call the vulnerability resolved.

### ORMs reduce but don't eliminate risk
Frameworks like SQLAlchemy or Hibernate parameterize queries by default when used normally — but they still expose raw-query escape hatches (`.raw()`, native queries) for performance-sensitive cases, and those escape hatches reintroduce the exact same vulnerability if a developer concatenates user input into them.

---

## 5. Self-Test — Don't Look Until You've Tried

1. Why can't the database tell the difference between a legitimate apostrophe in someone's name and an attacker's injected SQL syntax?
2. A UNION-based injection attempt keeps failing with a column-count error. What is the attacker most likely doing next, and why?
3. You send a payload and notice the response consistently takes 5 seconds longer than normal, with no visible content or error difference. Which injection type does this confirm, and what specifically did the database do to cause that delay?
4. Why does `admin'--` succeed at logging in without ever guessing a correct password?
5. Explain precisely why a parameterized query prevents injection — not just "it's safer," but the actual mechanism.
6. Why is blocklisting the word `UNION` or the character `'` not considered a real fix?

### Answers

1. Both arrive at the database as the same kind of thing — text inside a string that's been concatenated into the query. The database has no way to know that one apostrophe was "supposed to be" part of a name and another was "supposed to be" attacker syntax; by the time it receives the query, that distinction has already been lost.
2. Probing for the correct number of columns, usually with `ORDER BY 1`, `ORDER BY 2`, etc., increasing the number until the query stops erroring — because a `UNION SELECT` is rejected outright unless it returns exactly as many columns as the original query.
3. Blind time-based injection. The database actually executed an injected `SLEEP()` (or equivalent) function as part of the query — the consistent delay is direct evidence that injected SQL ran, even though nothing in the visible response changed.
4. The `--` comments out everything after it, including the password check itself. The query never evaluates a password at all — there's no comparison being skipped silently, the comparison literally no longer exists in the executed query.
5. The database driver sends the query's structure and the user-supplied data as two separate channels. The query plan is compiled first, using only the structure; the data is then substituted in afterward as a literal value that cannot alter the already-compiled structure — so no character the user supplies can ever be reinterpreted as part of the command.
6. Blocklists are inherently incomplete — alternate encodings, case variations, or comment-based workarounds can often slip past a keyword filter, and legitimate input (an apostrophe in a real name) gets wrongly blocked too. It treats the symptom rather than the actual structural cause.

---

## Quick Reference Card

```
ROOT CAUSE:      User input becomes part of query STRUCTURE instead of staying DATA

5 TYPES:
  Classic         — result visible directly in the response
  Error-based      — leaked error message reveals schema/version info
  UNION-based       — appends a second SELECT, must match column count
  Blind Boolean      — true/false behavior difference, no visible data
  Blind Time-based    — SLEEP() delay confirms execution, no visible signal

CLASSIC BYPASS:   admin' --              (comments out the password check)
UNION ATTACK:     ' UNION SELECT col1,col2 FROM other_table--
TIME-BASED TEST:  ' OR SLEEP(5)--

THE FIX:          Parameterized queries — data and structure sent separately,
                  compiled before substitution, so input can never become code

NOT A FIX:        Blocklisting characters/keywords — bypassable, treats symptom

ORM WARNING:      Default ORM usage is parameterized; raw-query escape hatches
                  (.raw(), native queries) reintroduce the exact same risk
```
