const rooms = [
  {
    id: 1,
    number: "101",
    type: "Single",
    status: "Available",
    price: 50,
  },
  {
    id: 2,
    number: "102",
    type: "Double",
    status: "Occupied",
    price: 80,
  },
  {
    id: 3,
    number: "103",
    type: "Suite",
    status: "Cleaning",
    price: 120,
  },
  {
    id: 4,
    number: "104",
    type: "Single",
    status: "Available",
    price: 55,
  },
];

function StatusBadge({ status }) {
  const styles = {
    Available: "bg-green-100 text-green-700",
    Occupied: "bg-red-100 text-red-700",
    Cleaning: "bg-yellow-100 text-yellow-700",
  };

  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export default function Rooms() {
  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-xl font-semibold">Rooms</h2>
        <p className="text-sm text-gray-500">
          Manage hotel rooms and availability
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white">
        <table className="w-full text-sm">

          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Room</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Price</th>
            </tr>
          </thead>

          <tbody>
            {rooms.map((room) => (
              <tr key={room.id} className="border-b last:border-0">

                <td className="px-4 py-3 font-medium">
                  {room.number}
                </td>

                <td className="px-4 py-3">
                  {room.type}
                </td>

                <td className="px-4 py-3">
                  <StatusBadge status={room.status} />
                </td>

                <td className="px-4 py-3">
                  ${room.price}
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  );
}
