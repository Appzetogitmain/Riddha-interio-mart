import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiStar, FiMessageSquare, FiTrendingUp, FiUsers, FiFilter, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';

const SellerReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [stats, setStats] = useState({
    avgRating: 0,
    totalReviews: 0,
    ratingDistribution: [0, 0, 0, 0, 0],
    reviewGrowth: '+0%',
    happyCustomers: '0%'
  });

  const getSellerName = () => {
    try {
      const raw = localStorage.getItem('riddha_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        const userObj = parsed.user || parsed;
        if (userObj && (userObj.storeName || userObj.name)) {
          return userObj.storeName || userObj.name;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return 'Riddha Seller';
  };

  const handleSendFeedback = () => {
    if (!feedback.trim()) {
      toast.error('Please enter your feedback before submitting.');
      return;
    }

    try {
      const recommendations = JSON.parse(localStorage.getItem('seller_recommendations') || '[]');
      const newFeedback = {
        id: Date.now(),
        subject: 'Direct Feedback',
        category: 'other',
        description: feedback.trim(),
        priority: 'medium',
        sellerName: getSellerName(),
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      localStorage.setItem('seller_recommendations', JSON.stringify([newFeedback, ...recommendations]));
      
      setFeedback('');
      toast.success('Your feedback has been sent to the admin!');
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      toast.error('Failed to send feedback.');
    }
  };

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data } = await api.get('/reviews/seller');
        if (data.success) {
          const fetchedReviews = data.data;
          setReviews(fetchedReviews);
          if (fetchedReviews.length > 0) {
            const total = fetchedReviews.length;
            const sum = fetchedReviews.reduce((acc, r) => acc + r.rating, 0);
            const dist = [0, 0, 0, 0, 0];
            let happyCount = 0;
            
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
            
            let recentReviews = 0;
            let olderReviews = 0;

            fetchedReviews.forEach(r => {
              dist[r.rating - 1]++;
              if (r.rating >= 4) happyCount++;
              
              const reviewDate = new Date(r.createdAt);
              if (reviewDate >= thirtyDaysAgo) {
                recentReviews++;
              } else if (reviewDate >= sixtyDaysAgo && reviewDate < thirtyDaysAgo) {
                olderReviews++;
              }
            });

            // Calculate Growth
            let growthString = '+0%';
            if (olderReviews === 0 && recentReviews > 0) {
              growthString = '+100%';
            } else if (olderReviews > 0) {
              const growth = ((recentReviews - olderReviews) / olderReviews) * 100;
              growthString = `${growth >= 0 ? '+' : ''}${Math.round(growth)}%`;
            }

            // Calculate Happy Customers
            const happyPercentage = Math.round((happyCount / total) * 100);

            setStats({
              avgRating: (sum / total).toFixed(1),
              totalReviews: total,
              ratingDistribution: dist.reverse(), // 5 stars first
              reviewGrowth: growthString,
              happyCustomers: `${happyPercentage}%`
            });
          } else {
            setStats({
              avgRating: 0,
              totalReviews: 0,
              ratingDistribution: [0, 0, 0, 0, 0],
              reviewGrowth: '+0%',
              happyCustomers: '0%'
            });
          }
        }
      } catch (err) {
        toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to load reviews');
      }
    };
    fetchReviews();
  }, []);

  const statCards = [
    { label: 'Average Rating', value: stats.avgRating, icon: <FiStar className="text-amber-400" />, sub: 'Out of 5.0' },
    { label: 'Total Reviews', value: stats.totalReviews, icon: <FiMessageSquare className="text-teal-500" />, sub: 'Customer Feedback' },
    { label: 'Review Growth', value: stats.reviewGrowth, icon: <FiTrendingUp className="text-green-500" />, sub: 'Last 30 days' },
    { label: 'Happy Customers', value: stats.happyCustomers, icon: <FiUsers className="text-blue-500" />, sub: 'Rating 4+' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Reviews & <span className="text-seller-primary font-bold">Ratings</span>
        </h1>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Monitor your premium brand reputation</p>
      </div>

      {/* Suggestion Professional Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden group flex flex-col md:flex-row items-center justify-between gap-8"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-seller-primary/5 rounded-full blur-[80px] -mr-40 -mt-40 group-hover:bg-seller-primary/10 transition-all duration-1000"></div>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-seller-primary/10 text-seller-primary rounded-3xl flex items-center justify-center border border-seller-primary/10">
            <FiMessageSquare size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Have an Idea for <span className="text-seller-primary font-bold">Riddha?</span></h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1.5">Suggest new features or improvements directly to the admin team.</p>
          </div>
        </div>
        <button 
          onClick={() => window.location.href = '/seller/recommendations'}
          className="bg-seller-primary text-white px-10 py-5 rounded-[1.8rem] font-bold text-[10px] uppercase tracking-widest hover:bg-seller-dark transition-all shadow-2xl shadow-seller-primary/20 active:scale-95 whitespace-nowrap relative z-10"
        >
          Give Recommendation
        </button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-gray-50">{card.icon}</div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">{card.label}</p>
            <p className="text-[9px] font-bold text-gray-300 mt-2 uppercase">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Rating Distribution */}
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm h-fit">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-8">Rating Distribution</h3>
          <div className="space-y-4">
            {stats.ratingDistribution.map((count, i) => {
              const starLevel = 5 - i;
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              return (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-gray-400 w-4">{starLevel}★</span>
                  <div className="flex-1 h-2 bg-gray-50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className="h-full bg-amber-400 rounded-full"
                    />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 w-8">{percentage.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Review List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Recent Feedbacks</h3>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-xl border border-gray-100 text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-all">
                <FiFilter size={14} />
              </button>
              <button className="p-2 rounded-xl border border-gray-100 text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-all">
                <FiCalendar size={14} />
              </button>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="bg-white py-20 rounded-[32px] border border-gray-100 text-center">
              <FiMessageSquare className="mx-auto text-gray-100 mb-4" size={48} />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No reviews received yet</p>
            </div>
          ) : (
            reviews.map((review, i) => (
              <motion.div
                key={review._id || review.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:border-teal-100 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-xs">
                      {review.product?.name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 uppercase tracking-tight">{review.product?.name || 'Unknown Product'}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <FiStar key={s} size={10} className={`${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-gray-600 font-medium leading-relaxed italic">"{review.review || review.comment}"</p>
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    {review.images.map((img, idx) => (
                      <img key={idx} src={img} className="w-12 h-12 rounded-xl object-cover border border-gray-50" alt="Review" />
                    ))}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Direct Feedback Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm"
      >
        <div className="flex flex-col md:flex-row gap-10">
          <div className="md:w-1/3">
            <h3 className="text-xl font-bold tracking-tight text-gray-900 mb-4">Send Feedback <span className="text-seller-primary font-bold">Directly</span></h3>
            <p className="text-gray-400 text-xs font-medium leading-relaxed">
              If you have any suggestions, issues, or recommendations for the platform, please share them here. Our admin team reviews every submission.
            </p>
            <div className="mt-8 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
               <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Response Time</p>
               <p className="text-[11px] font-bold text-gray-700 mt-1">Usually within 24-48 hours</p>
            </div>
          </div>
          <div className="flex-1 space-y-4">
             <textarea 
               value={feedback}
               onChange={(e) => setFeedback(e.target.value)}
               placeholder="Write your recommendation or feedback for the admin here..."
               className="w-full h-40 bg-gray-50 border border-gray-100 focus:border-seller-primary focus:bg-white rounded-[32px] p-8 outline-none text-sm font-medium transition-all resize-none"
             ></textarea>
             <button 
               onClick={handleSendFeedback}
               className="w-full md:w-auto px-12 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-seller-primary transition-all shadow-lg active:scale-95"
             >
               Send to Admin
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SellerReviews;
