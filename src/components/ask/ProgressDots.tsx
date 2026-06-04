type ProgressDotsProps = {
  current: number;
  total: number;
  answered: number;
  pending?: boolean;
};

export default function ProgressDots({
  current,
  total,
  answered,
  pending = false,
}: ProgressDotsProps) {
  return (
    <div className="ask-progress" aria-label={`${answered} of ${total} answers recorded`}>
      <div className="ask-progress__bars" aria-hidden>
        {Array.from({ length: total }).map((_, index) => {
          const step = index + 1;
          return (
            <span
              key={step}
              className="ask-progress__bar"
              data-current={step === current}
              data-filled={step <= answered}
              data-pending={pending && step === total}
            />
          );
        })}
      </div>
      <span className="ask-progress__label">
        {String(answered).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
    </div>
  );
}
