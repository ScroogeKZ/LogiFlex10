import CargoCard from '../CargoCard';

export default function CargoCardExample() {
  return (
    <div className="p-6 max-w-md">
      <CargoCard
        id="1"
        title="Строительные материалы"
        origin="Алматы"
        destination="Астана"
        weight={15.5}
        price={350000}
        pickupDate="2025-11-10"
        status="active"
        category="Стройматериалы"
      />
    </div>
  );
}