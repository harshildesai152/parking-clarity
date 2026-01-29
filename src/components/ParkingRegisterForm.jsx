import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'react-toastify';

// Fix for default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const StaticPinController = ({ onPositionChange }) => {
  const map = useMapEvents({
    move() {
      const center = map.getCenter();
      onPositionChange([center.lat, center.lng]);
    },
    moveend() {
      const center = map.getCenter();
      onPositionChange([center.lat, center.lng]);
    }
  });

  return null;
};

const INITIAL_FORM_DATA = {
  name: '',
  description: '',
  parkingType: 'paid',
  minDuration: '',
  category: 'office',
  location: { lat: '', lng: '' },
  vehicleType: 'car'
};

const INITIAL_OPERATING_HOURS = {
  monday: { open: '08:00', close: '20:00', isOpen: true },
  tuesday: { open: '08:00', close: '20:00', isOpen: true },
  wednesday: { open: '08:00', close: '20:00', isOpen: true },
  thursday: { open: '08:00', close: '20:00', isOpen: true },
  friday: { open: '08:00', close: '20:00', isOpen: true },
  saturday: { open: '09:00', close: '18:00', isOpen: true },
  sunday: { open: '09:00', close: '18:00', isOpen: true }
};

const ParkingRegisterForm = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [operatingHours, setOperatingHours] = useState(INITIAL_OPERATING_HOURS);
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState([19.0760, 72.8777]); // Default to Mumbai
  const [selectedPos, setSelectedPos] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setOperatingHours(INITIAL_OPERATING_HOURS);
    setSelectedPos(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleHourChange = (day, field, value) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const useCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({
            ...prev,
            location: { lat: latitude.toFixed(6), lng: longitude.toFixed(6) }
          }));
          setMapCenter([latitude, longitude]);
          setSelectedPos([latitude, longitude]);
          toast.success('Current location accurately captured!');
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error('Could not get your current location. Please select on map.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser.');
    }
  };

  const handleMapConfirm = () => {
    if (selectedPos) {
      setFormData(prev => ({
        ...prev,
        location: { lat: selectedPos[0].toFixed(6), lng: selectedPos[1].toFixed(6) }
      }));
      setShowMap(false);
      toast.info('Location pinned on map.');
    } else {
      toast.warning('Please click on the map to place a pin.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.location.lat || !formData.location.lng) {
      toast.error('Please fill in name and location.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Transform operatingHours to match API expectations (array of objects per day)
      const formattedOperatingHours = {};
      Object.keys(operatingHours).forEach(day => {
        formattedOperatingHours[day] = [operatingHours[day]];
      });

      const response = await fetch('/api/parking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          vehicleTypes: [formData.vehicleType],
          operatingHours: formattedOperatingHours
        })
      });

      if (!response.ok) throw new Error('Failed to register parking');

      toast.success('Parking spot registered successfully!');
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to register parking spot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Register New Parking</h2>
            <p className="text-blue-100 text-sm">Help others find parking by sharing details</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Parking Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Airport International Parking"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  required
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  >
                    <option value="hospital">Hospital</option>
                    <option value="office">Office</option>
                    <option value="transport">Transport</option>
                    <option value="shopping">Shopping</option>
                    <option value="shopping-mall">Shopping Mall</option>
                    <option value="market">Market</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell us more about this spot..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none h-24 resize-none"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Parking Type</label>
                  <select
                    name="parkingType"
                    value={formData.parkingType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  >
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                    <option value="street">Street</option>
                    <option value="covered">Covered</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Min Duration (min)</label>
                  <input
                    type="number"
                    name="minDuration"
                    value={formData.minDuration}
                    onChange={handleInputChange}
                    placeholder="e.g. 30"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Vehicle Type</label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                >
                  <option value="car">Car</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="truck">Truck</option>
                  <option value="ev">EV</option>
                </select>
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700">Location Settings *</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 font-bold text-xs hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                >
                  📍 Use My Location
                </button>
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className="flex-1 py-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 font-bold text-xs hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                >
                  🗺️ Select on Map
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Latitude</label>
                  <input
                    type="text"
                    value={formData.location.lat}
                    readOnly
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Longitude</label>
                  <input
                    type="text"
                    value={formData.location.lng}
                    readOnly
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm font-mono"
                  />
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl">
                 <p className="text-[11px] text-amber-700 leading-tight">
                   <span className="font-bold">Pro-tip:</span> Pinning on map is more accurate if you are not currently at the spot.
                 </p>
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="text-lg">🕒</span> Operating Hours
            </h3>
            <div className="space-y-3">
              {Object.keys(operatingHours).map(day => (
                <div key={day} className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-xl">
                  <span className="capitalize font-medium w-24">{day}</span>
                  <div className="flex items-center gap-3">
                    <input
                      type="time"
                      value={operatingHours[day].open}
                      onChange={(e) => handleHourChange(day, 'open', e.target.value)}
                      className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="time"
                      value={operatingHours[day].close}
                      onChange={(e) => handleHourChange(day, 'close', e.target.value)}
                      className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                    <label className="flex items-center gap-2 ml-4">
                      <input
                        type="checkbox"
                        checked={operatingHours[day].isOpen}
                        onChange={(e) => handleHourChange(day, 'isOpen', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-[10px] uppercase font-bold text-gray-500">Open</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-[2] px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
                Registering...
              </>
            ) : (
              'Register Parking Spot'
            )}
          </button>
        </div>
      </div>

      {/* Map Overlay for selecting location */}
      {showMap && (
        <div className="fixed inset-0 z-[11000] bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl h-[80vh] overflow-hidden flex flex-col relative">
            <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900">Move Pin to Parking Entrance</h3>
                <p className="text-xs text-gray-500">Click anywhere to move the pin</p>
              </div>
              <button 
                onClick={() => setShowMap(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 relative">
              <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <StaticPinController onPositionChange={setSelectedPos} />
              </MapContainer>
              
              {/* Static Centered Pin Overlay */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full pointer-events-none z-[1000]">
                <div className="relative">
                  <div className="absolute -inset-2 rounded-full opacity-30 animate-pulse bg-red-500"></div>
                  <div className="relative bg-red-500 w-8 h-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <div className="bg-white w-3 h-3 rounded-full"></div>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-red-500"></div>
                </div>
              </div>

              {/* Live Coordinates Display */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-xl flex items-center gap-4 border border-blue-100 pointer-events-none z-[1000]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">LAT</span>
                  <span className="font-mono text-sm font-bold text-gray-800">
                    {(selectedPos ? selectedPos[0] : mapCenter[0]).toFixed(6)}
                  </span>
                </div>
                <div className="w-px h-4 bg-gray-200"></div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">LNG</span>
                  <span className="font-mono text-sm font-bold text-gray-800">
                    {(selectedPos ? selectedPos[1] : mapCenter[1]).toFixed(6)}
                  </span>
                </div>
              </div>
              
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full text-xs font-bold shadow-xl pointer-events-none z-[1000]">
                Move the map to set location
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
              <button
                onClick={handleMapConfirm}
                className="px-12 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all active:scale-95"
              >
                Confirm This Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParkingRegisterForm;
