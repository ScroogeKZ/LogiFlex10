import BidCard from '../BidCard';

export default function BidCardExample() {
  return (
    <div className="p-6 max-w-md">
      <BidCard
        id="1"
        carrierName="ТрансАзия Логистика"
        rwsScore={92}
        bidAmount={340000}
        deliveryTime="3 дня"
        vehicleType="Фура 20т"
        completedDeliveries={247}
      />
    </div>
  );
}