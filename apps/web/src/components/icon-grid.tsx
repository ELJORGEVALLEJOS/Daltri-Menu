import { Wheat, Fish, Milk, Egg, Nut, Citrus, Vegan } from "lucide-react";

export function IconGrid() {
    const icons = [
        { icon: Wheat, color: "bg-yellow-400" },
        { icon: Fish, color: "bg-red-400" },
        { icon: Milk, color: "bg-purple-300" },
        { icon: Vegan, color: "bg-orange-400" },
        { icon: Nut, color: "bg-orange-300" },
        { icon: Egg, color: "bg-green-500" },
        { icon: Citrus, color: "bg-yellow-500" },
        { icon: Fish, color: "bg-blue-400" },
    ];

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <div className="grid grid-cols-4 gap-4">
                {icons.map((item, i) => (
                    <div key={i} className={`aspect-square rounded-full ${item.color} flex items-center justify-center text-white border-2 border-white shadow-sm`}>
                        <item.icon className="w-6 h-6 text-white" />
                    </div>
                ))}
            </div>
        </div>
    );
}
