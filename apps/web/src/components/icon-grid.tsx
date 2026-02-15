import { Wheat, Fish, Milk, Egg, Nut, Citrus, Vegan, Flame } from "lucide-react";

export function IconGrid() {
    const icons = [
        { icon: Wheat, name: "Gluten", color: "bg-yellow-400" },
        { icon: Fish, name: "Pescado", color: "bg-blue-400" },
        { icon: Milk, name: "Lácteos", color: "bg-purple-300" },
        { icon: Egg, name: "Huevo", color: "bg-zinc-100", textColor: "text-zinc-800" },
        { icon: Nut, name: "Frutos Secos", color: "bg-orange-300" },
        { icon: Flame, name: "Picante", color: "bg-red-500" },
        { icon: Vegan, name: "Vegano", color: "bg-green-500" },
        { icon: Citrus, name: "Cítrico", color: "bg-yellow-200", textColor: "text-zinc-800" },
    ];

    return (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-100/50 mb-12">
            <h3 className="text-xl font-sans font-bold mb-6 text-gray-800 px-2 tracking-tight">Información Dietética</h3>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
                {icons.map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 group cursor-help">
                        <div className={`aspect-square w-full sm:w-12 rounded-full ${item.color} flex items-center justify-center ${item.textColor || 'text-white'} border-4 border-white shadow-premium transition-transform group-hover:scale-110`}>
                            <item.icon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter text-center">
                            {item.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
