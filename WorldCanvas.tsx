import { useState, useEffect, useRef } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

// Dynamic variables to hold Leaflet components
let L: any;
let MapContainer: any;
let TileLayer: any;
let Marker: any;
let Popup: any;
let useMapEvents: any;
let useMap: any;

/**
 * Sub-component that handles map interactions and content
 */
function MapContent({ posts }: { posts: any[] }) {
  const createPost = useMutation(api.posts.create);
  const map = useMap();
  
  const [newPostPos, setNewPostPos] = useState<{ lat: number; lng: number } | null>(null);
  const [text, setText] = useState("");
  const [emoji, setEmoji] = useState("✨");

  useMapEvents({
    click(e: any) {
      setNewPostPos({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostPos || !text.trim()) return;

    await createPost({
      lat: newPostPos.lat,
      lng: newPostPos.lng,
      text: text.trim(),
      emoji,
    });

    setNewPostPos(null);
    setText("");
  };

  const handleRandomJump = () => {
    const randomLat = (Math.random() * 140) - 70;
    const randomLng = (Math.random() * 360) - 180;
    map.flyTo([randomLat, randomLng], 4, { duration: 3 });
  };

  return (
    <>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; CARTO'
      />
      
      {posts.map((post) => (
        <Marker 
            key={post._id} 
            position={[post.lat, post.lng]}
            icon={L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="marker-glow flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 border border-blue-400/30 shadow-[0_0_20px_rgba(96,165,250,0.3)]">
                        <span class="text-lg drop-shadow-md select-none">${post.emoji || '✨'}</span>
                      </div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            })}
        >
            <Popup className="custom-popup" closeButton={false}>
            <div className="p-4 min-w-[200px] bg-white text-gray-900 rounded-3xl shadow-2xl font-sans border border-white/50">
                <p className="text-base font-light italic leading-relaxed">"{post.text}"</p>
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Trace</span>
                    <span className="text-[10px] text-gray-300">
                        {new Date(post._creationTime).toLocaleDateString()}
                    </span>
                </div>
            </div>
            </Popup>
        </Marker>
      ))}

      {newPostPos && (
        <Marker position={[newPostPos.lat, newPostPos.lng]}>
          <Popup autoOpen closeButton={false} className="create-popup">
            <form onSubmit={handleSubmit} className="p-5 w-72 space-y-4 font-sans bg-white rounded-[2rem] shadow-2xl">
              <div className="space-y-1">
                  <h3 className="text-lg font-medium text-gray-900">Leave a Trace</h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Coordinate: {newPostPos.lat.toFixed(2)}, {newPostPos.lng.toFixed(2)}</p>
              </div>
              <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                      <input 
                          type="text" 
                          value={emoji} 
                          onChange={(e) => setEmoji(e.target.value)}
                          className="w-12 h-12 p-0 border border-gray-100 rounded-2xl text-center bg-gray-50 text-xl outline-none"
                          maxLength={2}
                      />
                      <input
                          autoFocus
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          placeholder="Your thought..."
                          className="flex-1 px-4 border border-gray-100 rounded-2xl bg-gray-50 text-sm outline-none text-gray-800"
                      />
                  </div>
                  <button 
                    type="submit"
                    disabled={!text.trim()}
                    className="w-full bg-black text-white py-4 rounded-2xl hover:bg-gray-800 transition-all text-xs tracking-widest uppercase disabled:opacity-30"
                  >
                    Cast into World
                  </button>
                  <button 
                      type="button"
                      onClick={() => setNewPostPos(null)}
                      className="w-full text-gray-400 text-[10px] uppercase tracking-widest py-1"
                  >
                      Discard
                  </button>
              </div>
            </form>
          </Popup>
        </Marker>
      )}

      {/* Random Jump Button */}
      <div className="absolute bottom-10 right-8 z-[1000]">
        <button 
          onClick={handleRandomJump}
          className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-6 py-4 rounded-2xl hover:bg-white/20 hover:scale-105 active:scale-95 transition-all text-xs tracking-[0.3em] uppercase font-sans shadow-2xl pointer-events-auto"
        >
          Random Jump
        </button>
      </div>
    </>
  );
}

/**
 * Main WorldCanvas component
 */
export default function WorldCanvas() {
  const { data: posts } = useSuspenseQuery(convexQuery(api.posts.list, {}));
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const initialize = async () => {
      try {
        const [leaflet, reactLeaflet] = await Promise.all([
          import("leaflet"),
          import("react-leaflet"),
          import("leaflet/dist/leaflet.css"),
        ]);
        
        L = leaflet.default;
        ({ MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } = reactLeaflet);

        const [markerIcon, markerShadow] = await Promise.all([
          import("leaflet/dist/images/marker-icon.png"),
          import("leaflet/dist/images/marker-shadow.png"),
        ]);
        
        const DefaultIcon = L.icon({
          iconUrl: markerIcon.default,
          shadowUrl: markerShadow.default,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        });
        L.Marker.prototype.options.icon = DefaultIcon;
        
        setReady(true);
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };

    initialize();
  }, []);

  if (!ready) {
    return (
      <div className="h-screen w-screen bg-[#0b0e14] flex items-center justify-center">
        <div className="text-white/20 animate-pulse tracking-[0.5em] uppercase text-xl font-sans font-light">
          Canvas Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen relative bg-[#0b0e14] overflow-hidden" ref={containerRef}>
      <MapContainer
        center={[20, 0]}
        zoom={3}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
        maxBounds={[[-85, -180], [85, 180]]}
        minZoom={2}
        // Providing a unique ID for the container to avoid reuse issues
        id="world-map-container"
      >
        <MapContent posts={posts} />
      </MapContainer>

      {/* UI Overlays */}
      <div className="absolute top-10 left-10 z-[1000] pointer-events-none select-none">
        <h1 className="text-4xl md:text-5xl font-light text-white tracking-[0.4em] uppercase drop-shadow-2xl font-sans opacity-90">
          World Canvas
        </h1>
        <div className="mt-4 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
            <p className="text-white/40 text-[10px] font-medium tracking-[0.3em] font-sans uppercase">
              {posts.length} human traces recorded
            </p>
        </div>
      </div>

      <div className="absolute bottom-10 left-10 z-[1000] pointer-events-none">
        <p className="text-white/20 text-[9px] tracking-[0.4em] uppercase font-sans">
            Tap anywhere to participate
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .leaflet-container { background: #0b0e14 !important; }
        .marker-glow { animation: marker-pulse 4s infinite; }
        @keyframes marker-pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.4); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(96, 165, 250, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(96, 165, 250, 0); }
        }
        .leaflet-popup-content-wrapper { padding: 0 !important; background: transparent !important; box-shadow: none !important; }
        .leaflet-popup-tip-container { display: none !important; }
      `}} />
    </div>
  );
}
