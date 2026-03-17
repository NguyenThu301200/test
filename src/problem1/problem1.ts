/* 
    Algorithm Gauss Formula 
    Time complexity: O(1) because we are performing a constant number of operations regardless of the input size n.
    Space complexity: O(1) because we are using a constant amount of space to store the variables and the result, regardless of the input size n.
*/
var sum_to_n_a = function (n: number): number {
  return (n * (n + 1)) / 2;
};

/* 
    Algorithm Iterative Loop
    Time complexity: O(n) because we need to iterate from 1 to n once.
    Space complexity: O(1) because we only use a single variable `sum` regardless of the input size n.
*/
var sum_to_n_b = function (n: number): number {
  let sum: number = 0;
  for (let i = 1; i <= n; i++) {
    sum += i;
  }
  return sum;
};

/* 
    Algorithm Recursive
    Time complexity: O(n) because we make n recursive calls, each reducing n by 1 until it reaches 0.
    Space complexity: O(n) because each recursive call adds a new frame to the call stack, using O(n) stack space.
*/
var sum_to_n_c = function (n: number): number {
  if (n <= 0) return 0;
  return n + sum_to_n_c(n - 1);
};
