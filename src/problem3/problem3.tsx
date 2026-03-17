interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string; // was missing from original
}

interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
}

// moved outside — no dependencies on component state, no reason to recreate every render
const BLOCKCHAIN_PRIORITY: Record<string, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};

const getPriority = (blockchain: string): number =>
  BLOCKCHAIN_PRIORITY[blockchain] ?? -99;

const WalletPage: React.FC<BoxProps> = ({ children, ...rest }) => {
  const balances = useWalletBalances();
  const prices = usePrices();

  // prices removed from deps — it's not used in this memo
  const sortedBalances = useMemo(() => {
    return balances
      .filter(
        (balance: WalletBalance) =>
          getPriority(balance.blockchain) > -99 && balance.amount > 0, // fixed inverted logic
      )
      .sort(
        (lhs: WalletBalance, rhs: WalletBalance) =>
          getPriority(rhs.blockchain) - getPriority(lhs.blockchain), // cleaner comparator, handles equal case
      );
  }, [balances]);

  // single pass — compute formatted here, use it in rows
  const rows = sortedBalances.map((balance: WalletBalance) => {
    const formatted: FormattedWalletBalance = {
      ...balance,
      formatted: balance.amount.toFixed(2), // explicit decimal places
    };

    return (
      <WalletRow
        className={classes.row}
        key={balance.currency} // stable key, not index
        amount={formatted.amount}
        usdValue={(prices[formatted.currency] ?? 0) * formatted.amount}
        formattedAmount={formatted.formatted}
      />
    );
  });

  return <div {...rest}>{rows}</div>;
};
