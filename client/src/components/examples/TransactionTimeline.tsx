import TransactionTimeline from '../TransactionTimeline';

export default function TransactionTimelineExample() {
  const steps = [
    {
      id: "1",
      title: "Груз опубликован",
      status: "completed" as const,
      timestamp: "2025-11-05 10:30",
      description: "Грузоотправитель создал заявку"
    },
    {
      id: "2",
      title: "Получены предложения",
      status: "completed" as const,
      timestamp: "2025-11-05 14:20",
      description: "5 перевозчиков сделали предложения"
    },
    {
      id: "3",
      title: "Выбран перевозчик",
      status: "current" as const,
      timestamp: "2025-11-06 09:15",
      description: "Ожидание подтверждения от перевозчика"
    },
    {
      id: "4",
      title: "Груз в пути",
      status: "pending" as const
    },
    {
      id: "5",
      title: "Доставка завершена",
      status: "pending" as const
    }
  ];

  return (
    <div className="p-6 max-w-md">
      <TransactionTimeline steps={steps} />
    </div>
  );
}