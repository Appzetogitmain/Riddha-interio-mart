import React, { useState } from 'react';
import PageWrapper from '../components/PageWrapper';
import { 
  LuMapPin, 
  LuSearch, 
  LuChevronDown, 
  LuPhone, 
  LuMail, 
  LuPlus, 
  LuMinus 
} from 'react-icons/lu';

const sellersData = [
  { 
    id: 1, 
    name: 'Laxmi Libas', 
    owner: 'Rohit sah', 
    address: 'Laxmi libas noamundi bazar, Noamundi', 
    coords: '22.1573467, 85.5049239', 
    phone: '7004308732', 
    email: 'laxmilibas2@gmail.com', 
    status: 'Approved' 
  },
  { 
    id: 2, 
    name: 'ADI ENTERPRISES', 
    owner: 'Chandan Sah', 
    address: 'Laxmi Niwas, Station Road, Noamundi', 
    coords: '22.157372721519863, 85.50499567051832', 
    phone: '8981478030', 
    email: 'chandansah100@gmail.com', 
    status: 'Approved' 
  },
  { 
    id: 3, 
    name: 'Palak shop', 
    owner: 'Palak shop', 
    address: 'Vijaynagar, Indore', 
    coords: '0, 0', 
    phone: '8770620342', 
    email: 'palakpatel0342@gmail.com', 
    status: 'Approved' 
  },
  { 
    id: 4, 
    name: 'vijaynagar', 
    owner: 'aashu', 
    address: 'vijaynagar indore', 
    coords: '0, 0', 
    phone: '787945678', 
    email: 'aashu@gmail.com', 
    status: 'Approved' 
  },
];

const SellerLocationPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  return (
    <PageWrapper>
      <div className="w-full space-y-6">
        {/* Breadcrumbs & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-display font-bold text-deep-espresso">Seller Locations</h1>
          <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <span className="text-red-800">Home</span>
            <span className="text-warm-sand">/</span>
            <span className="text-deep-espresso">Seller Locations</span>
          </nav>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-6 rounded-2xl border border-soft-oatmeal shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-deep-espresso uppercase tracking-widest pl-1">Search Sellers</label>
            <div className="relative">
              <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-sand" size={18} />
              <input 
                type="text" 
                placeholder="Search by name, store, city, or address..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-soft-oatmeal rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-800/20 transition-all text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-deep-espresso uppercase tracking-widest pl-1">Filter by Status</label>
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-800/20 transition-all cursor-pointer"
              >
                <option>All Status</option>
                <option>Approved</option>
                <option>Pending</option>
              </select>
              <LuChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-sand pointer-events-none" size={18} />
            </div>
          </div>
        </div>

        {/* Main Content: Map & List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
          {/* Map Section */}
          <div className="lg:col-span-2 flex flex-col bg-white rounded-2xl border border-soft-oatmeal shadow-md overflow-hidden">
            <div className="bg-red-800 px-6 py-4">
              <h3 className="text-white font-bold tracking-wide">Seller Locations Map</h3>
            </div>
            <div className="flex-grow relative bg-slate-100 overflow-hidden">
               {/* Map Placeholder with Image/Styling */}
               <div className="absolute inset-0 opacity-40 mix-blend-multiply">
                 <img 
                   src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200" 
                   alt="Map Background" 
                   className="w-full h-full object-cover grayscale"
                 />
               </div>
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="text-warm-sand font-display font-black text-4xl opacity-10 uppercase tracking-[2em] -rotate-12 select-none">
                   Interactive Map View
                 </div>
               </div>

               {/* Zoom Controls */}
               <div className="absolute top-4 left-4 flex flex-col gap-2">
                 <button className="w-8 h-8 bg-white rounded-md shadow-md border border-soft-oatmeal flex items-center justify-center text-deep-espresso hover:bg-soft-oatmeal transition-colors font-bold">
                   <Plus size={16} />
                 </button>
                 <button className="w-8 h-8 bg-white rounded-md shadow-md border border-soft-oatmeal flex items-center justify-center text-deep-espresso hover:bg-soft-oatmeal transition-colors font-bold">
                   <Minus size={16} />
                 </button>
               </div>

               {/* Marker Example */}
               <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
                 <div className="relative">
                   <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-white rounded shadow-lg border border-soft-oatmeal whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                     <p className="text-[10px] font-bold text-deep-espresso">Laxmi Libas</p>
                   </div>
                   <LuMapPin className="text-red-800 drop-shadow-lg scale-125" size={32} />
                   <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/20 rounded-full blur-[1px]"></div>
                 </div>
               </div>
            </div>
          </div>

          {/* List Section */}
          <div className="flex flex-col bg-white rounded-2xl border border-soft-oatmeal shadow-md overflow-hidden">
            <div className="bg-red-800 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold tracking-wide">Sellers ({sellersData.length})</h3>
            </div>
            <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-soft-oatmeal divide-y divide-soft-oatmeal/50">
              {sellersData.map((seller) => (
                <div key={seller.id} className="p-6 space-y-3 hover:bg-soft-oatmeal/10 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-deep-espresso group-hover:text-red-800 transition-colors">{seller.name}</h4>
                      <p className="text-xs text-warm-sand font-medium">{seller.owner}</p>
                    </div>
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                      {seller.status}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2 text-[11px] text-warm-sand font-bold leading-tight">
                      <LuMapPin className="text-red-800 shrink-0" size={12} />
                      <span>{seller.address}</span>
                    </div>
                    <div className="pl-5 text-[10px] text-warm-sand/70 font-medium">
                      {seller.coords}
                    </div>
                    <div className="flex items-center gap-4 pl-5 pt-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-warm-sand font-bold">
                        <LuPhone className="text-red-800" size={10} />
                        {seller.phone}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-warm-sand font-bold">
                        <LuMail className="text-red-800" size={10} />
                        {seller.email}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

// Simple icon wrapper to match the style
const Plus = ({size}) => <LuPlus size={size} />;
const Minus = ({size}) => <LuMinus size={size} />;

export default SellerLocationPage;
