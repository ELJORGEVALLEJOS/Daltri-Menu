import { Facebook, Instagram, Twitter, ExternalLink, Phone, Mail, Globe, LayoutGrid } from 'lucide-react';

export function SocialLinks() {
    const socials = [
        { name: 'Uber Eats', icon: LayoutGrid, href: '#' },
        { name: 'Google', icon: Globe, href: '#' },
        { name: 'Instagram', icon: Instagram, href: '#' },
        { name: 'Facebook', icon: Facebook, href: '#' },
        { name: 'TikTok', icon: LayoutGrid, href: '#' },
    ];

    return (
        <div className="mb-12">
            <h3 className="text-2xl font-sans font-bold mb-6 text-gray-800 tracking-tight px-2">Nuestras redes sociales</h3>
            <div className="space-y-4">
                {socials.map((social) => (
                    <a
                        key={social.name}
                        href={social.href}
                        className="flex items-center justify-between p-5 bg-white rounded-2xl shadow-premium border border-gray-100/50 hover:scale-[1.01] transition-all active:scale-[0.99]"
                    >
                        <div className="flex items-center gap-5">
                            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                <social.icon className="w-7 h-7 text-gray-800" />
                            </div>
                            <span className="font-bold text-gray-800 text-lg">{social.name}</span>
                        </div>
                        <ExternalLink className="w-6 h-6 text-gray-400 mr-2" />
                    </a>
                ))}
            </div>
        </div>
    );
}

export function ContactInfo() {
    return (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-100/50 mb-24 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-beige/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            <div className="flex items-center gap-6 mb-8 border-b border-gray-50 pb-6">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <LayoutGrid className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-3xl font-sans font-black text-gray-900 tracking-tighter">Contacto</h3>
            </div>

            <div className="space-y-8">
                <div className="flex items-center gap-6 group">
                    <div className="bg-gray-50 p-4 rounded-full border border-gray-100 group-hover:bg-beige/20 transition-colors">
                        <Phone className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Teléfono</p>
                        <p className="text-xl font-bold text-gray-900 tracking-tight">(123) 555-3000</p>
                    </div>
                </div>

                <div className="flex items-center gap-6 group">
                    <div className="bg-gray-50 p-4 rounded-full border border-gray-100 group-hover:bg-beige/20 transition-colors">
                        <Mail className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">E-mail</p>
                        <p className="text-xl font-bold text-gray-900 tracking-tight">alex@alexcuisine.com</p>
                    </div>
                </div>

                <div className="flex items-center gap-6 group">
                    <div className="bg-gray-50 p-4 rounded-full border border-gray-100 group-hover:bg-beige/20 transition-colors">
                        <Globe className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Sitio web</p>
                        <p className="text-xl font-bold text-gray-900 tracking-tight">www.alexandrecuisine.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
