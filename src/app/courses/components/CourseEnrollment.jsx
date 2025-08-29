import React, { useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';
import { 
  FaRegClock, 
  FaFileDownload, 
  FaPlayCircle, 
  FaCertificate,
  FaShoppingCart,
  FaCheck,
  FaRobot,
  FaQuestionCircle,
  FaMobileAlt,
  FaVideo
} from 'react-icons/fa';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';

const CheckoutForm = ({ courseId, price, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setProcessing(true);
    
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/courses/${courseId}/success`,
      },
      redirect: 'if_required',
    });
    
    if (error) {
      setError(error.message);
      toast.error(error.message || 'Payment failed');
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/courses/${courseId}/enroll`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id })
        });
        
        if (response.ok) {
          onSuccess();
        } else {
          const data = await response.json();
          setError(data.error || 'Enrollment failed after payment');
          toast.error('Enrollment failed after payment. Please contact support.');
        }
      } catch (err) {
        setError('Enrollment failed. Please try again.');
        toast.error('Enrollment failed. Please try again.');
      }
      setProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-6">
      <PaymentElement className="mb-6" />
      {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
          !stripe || processing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-[#0b4c8b] hover:bg-[#0b4c8b]/90 transition-colors duration-200'
        }`}
      >
        {processing ? 'Processing...' : `Pay $${price.toFixed(2)}`}
      </button>
    </form>
  );
};

const CourseEnrollment = ({ 
  course, 
  isEnrolled, 
  onEnroll, 
  showCheckout, 
  clientSecret, 
  onCheckoutSuccess,
  courseId
}) => {
  const { addItem, removeItem, isInCart } = useCartStore();
  const inCart = course ? isInCart(course._id) : false;
  
  const handleAddToCart = () => {
    if (inCart) {
      removeItem(course._id);
      toast.success('Removed from cart');
    } else {
      addItem(course);
      toast.success('Added to cart');
    }
  };

  return (
    <div className="sticky top-6">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="p-6">
          {showCheckout && clientSecret ? (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Complete Your Purchase</h3>
              <CheckoutForm 
                courseId={courseId} 
                price={course.price} 
                onSuccess={onCheckoutSuccess} 
              />
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {course.price === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    `$${course.price.toFixed(2)}`
                  )}
                </div>
                {course.originalPrice && course.originalPrice > course.price && (
                  <div className="flex items-center justify-center mt-1">
                    <span className="text-lg text-gray-500 line-through mr-2">${course.originalPrice.toFixed(2)}</span>
                    <span className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      {Math.round((1 - course.price / course.originalPrice) * 100)}% off
                    </span>
                  </div>
                )}
              </div>
              
              {!isEnrolled ? (
                <>
                  <button
                    onClick={onEnroll}
                    className={`w-full py-3 px-4 rounded-lg font-medium text-white mb-3
                      bg-[#0b4c8b] hover:bg-[#0b4c8b]/90 transition-colors duration-200`}
                  >
                    {course.price > 0 ? 'Enroll Now' : 'Enroll for Free'}
                  </button>
                  
                  <button
                    onClick={handleAddToCart}
                    className={`w-full py-3 px-4 rounded-lg font-medium mb-3 flex items-center justify-center
                      ${inCart 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                        : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-300'
                      } transition-colors duration-200`}
                  >
                    {inCart ? <FaCheck className="mr-2" /> : <FaShoppingCart className="mr-2" />}
                    {inCart ? 'Remove from Cart' : 'Add to Cart'}
                  </button>
                </>
              ) : (
                <Link
                  href={`/courses/${course._id}/learn`}
                  className="w-full py-3 px-4 rounded-lg font-medium text-white mb-3 bg-green-600 hover:bg-green-700 
                    transition-colors duration-200 flex items-center justify-center"
                >
                  <FaPlayCircle className="mr-2" />
                  Start Learning
                </Link>
              )}
              
              <p className="text-center text-sm text-gray-500 mb-6">
                {course.price > 0 ? '30-Day Money-Back Guarantee' : 'Free lifetime access'}
              </p>
              
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-gray-900 border-b border-gray-200 pb-3">This course includes:</h3>
                <ul className="space-y-3">
                  <li className="flex items-center text-sm text-gray-700">
                    <FaPlayCircle className="text-[#0b4c8b] mr-3 flex-shrink-0" />
                    <span>{course.lectures?.length || 0} on-demand video lectures</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <FaRobot className="text-[#0b4c8b] mr-3 flex-shrink-0" />
                    <span>AI-generated summaries for each lecture</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <FaQuestionCircle className="text-[#0b4c8b] mr-3 flex-shrink-0" />
                    <span>Interactive quizzes and assessments</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <FaMobileAlt className="text-[#0b4c8b] mr-3 flex-shrink-0" />
                    <span>Access on all devices</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <FaVideo className="text-[#0b4c8b] mr-3 flex-shrink-0" />
                    <span>Virtual classroom sessions</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <FaRobot className="text-[#0b4c8b] mr-3 flex-shrink-0" />
                    <span>AI-powered learning assistance</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <FaRegClock className="text-[#0b4c8b] mr-3 flex-shrink-0" />
                    <span>Full lifetime access</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <FaCertificate className="text-[#0b4c8b] mr-3 flex-shrink-0" />
                    <span>Certificate of completion</span>
                  </li>
                </ul>
              </div>
              
              {!isEnrolled && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center text-sm font-medium text-gray-700 justify-center">
                    <svg className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {course.price > 0 ? "Buy now, start anytime" : "Enroll now, start anytime"}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="mt-4 text-xs text-gray-500">
          By enrolling, you agree to our Terms of Use and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default CourseEnrollment;