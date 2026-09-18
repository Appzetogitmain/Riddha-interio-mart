import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';

const HireProfessionalPage = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectDetails, setProjectDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        const res = await api.get(`/v1/service-requests/professionals/${category}`);
        setProfessionals(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfessionals();
  }, [category]);

  const handleBroadcast = async () => {
    if (!projectDetails) {
      return toast.error('Please provide some project details.');
    }
    try {
      setIsSubmitting(true);
      await api.post('/v1/service-requests', {
        category,
        projectDetails
      });
      toast.success(`Request sent to all available ${category}s!`);
      navigate('/my-service-requests');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading professionals...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black text-gray-900 mb-2">Hire a {category}</h1>
      <p className="text-gray-500 mb-8">
        We have {professionals.length} verified {category}(s) available right now. 
        Describe your project, and the first one to accept will contact you for a <strong>FREE consultancy call</strong>.
      </p>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Project Details</h2>
        <textarea
          value={projectDetails}
          onChange={(e) => setProjectDetails(e.target.value)}
          placeholder="E.g., I want to redesign my living room. Approx 300 sq ft. I prefer modern minimal style."
          className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#189D91] min-h-[100px] mb-4"
        />
        <button
          onClick={handleBroadcast}
          disabled={isSubmitting || professionals.length === 0}
          className="w-full bg-[#189D91] text-white py-3 rounded-xl font-bold hover:bg-[#137c72] transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Sending Request...' : `Broadcast Request to ${category}s`}
        </button>
      </div>

      <h2 className="text-xl font-bold mb-4">Available {category}s</h2>
      {professionals.length === 0 ? (
        <p className="text-gray-500">No {category}s are currently available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {professionals.map(p => (
            <div key={p._id} className="border p-4 rounded-xl flex items-center gap-4 bg-gray-50">
              <div className="h-12 w-12 rounded-full bg-[#189D91]/10 flex items-center justify-center font-bold text-[#189D91]">
                {p.avatar ? (
                  <img src={p.avatar} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                ) : (
                  p.fullName[0].toUpperCase()
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{p.fullName}</h3>
                <p className="text-xs text-gray-500">⭐ {p.professionalProfile?.rating?.toFixed(1) || '5.0'} / 5.0</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HireProfessionalPage;
