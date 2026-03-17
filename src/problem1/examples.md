# Examples

## Pass

```typescript
sum_to_n_a(5); // 15
```

`5 * (5 + 1) / 2 = 5 * 6 / 2 = 30 / 2 = 15`

---

```typescript
sum_to_n_b(5); // 15
```

```
i=1 → sum=1
i=2 → sum=3
i=3 → sum=6
i=4 → sum=10
i=5 → sum=15
```

---

```typescript
sum_to_n_c(5); // 15
```

```
sum_to_n_c(5) = 5 + sum_to_n_c(4)
             = 5 + 4 + sum_to_n_c(3)
             = 5 + 4 + 3 + sum_to_n_c(2)
             = 5 + 4 + 3 + 2 + sum_to_n_c(1)
             = 5 + 4 + 3 + 2 + 1 + sum_to_n_c(0)
             = 5 + 4 + 3 + 2 + 1 + 0
             = 15
```

---

## Fail

```typescript
sum_to_n_a(-3); // 3 — wrong
```

The formula computes `(-3 * -2) / 2 = 3`, which is mathematically valid but not the intended behavior. `n <= 0` should return `0`.

---

```typescript
sum_to_n_b(-3); // 0 — accidental pass
```

The loop condition `i <= -3` is false from the start, so it never runs and returns `0`. Works by accident, not by design.

---

```typescript
sum_to_n_c(100000); // RangeError: Maximum call stack size exceeded
```

Each call pushes a frame onto the call stack. At `n = 100000`, the stack runs out of space before reaching the base case.
