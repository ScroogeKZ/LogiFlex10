import RWSScore from '../RWSScore';

export default function RWSScoreExample() {
  return (
    <div className="p-6 max-w-md">
      <RWSScore
        score={92}
        onTimeDelivery={95}
        cargoCondition={92}
        communication={88}
        documentation={93}
      />
    </div>
  );
}