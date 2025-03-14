import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import assets from '../assets/assets_frontend/assets';
import ReleatedDoctors from '../components/ReleatedDoctors';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Stethoscope, Calendar, CheckCircle } from 'lucide-react';

const Appointments = () => {
  const { docId } = useParams();
  const { doctors, backendurl, token, getdoctorsdata, userdata } = useContext(AppContext);
  const daysofWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const navigate = useNavigate();

  const [docInfo, setDocInfo] = useState(null);
  const [docSlots, setDocSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [validationError, setValidationError] = useState('');

  const loadingMessages = [
    "Checking Available Slots...",
    "We are confirming Your Booking...",
    "Booking is Confirmed!"
  ];

  const LoadingState = ({ step }) => {
    const icons = [
      <Stethoscope className="w-12 h-12 text-primary animate-pulse" />,
      <Calendar className="w-12 h-12 text-primary animate-bounce" />,
      <CheckCircle className="w-12 h-12 text-green-500 animate-ping" />
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <div className="mb-4">
              {icons[step]}
            </div>
            <div className="relative w-64 h-2 bg-gray-200 rounded-full mb-4">
              <div 
                className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(step + 1) * 33.33}%` }}
              />
            </div>
            <p className="text-lg font-medium text-gray-800 text-center">
              {loadingMessages[step]}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const fetchDocInfo = async () => {
    const docInfo = doctors.find(doc => doc._id === docId);
    setDocInfo(docInfo);
  };

  const getAvailableSlots = () => {
    setDocSlots([]);
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      let currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);

      let endTime = new Date(currentDate);
      endTime.setHours(21, 0, 0, 0);

      if (i === 0) {
        const now = new Date();
        const startHour = now.getMinutes() > 30 ? now.getHours() + 1 : now.getHours();
        const startMinutes = now.getMinutes() > 30 ? 0 : 30;

        currentDate.setHours(startHour);
        currentDate.setMinutes(startMinutes);
      } else {
        currentDate.setHours(10);
        currentDate.setMinutes(0);
      }

      let timeSlots = [];

      while (currentDate < endTime) {
        let formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let day = currentDate.getDate();
        let month = currentDate.getMonth() + 1;
        let year = currentDate.getFullYear();

        const slotDate = day + "_" + month + "_" + year;
        const slotTime = formattedTime;

        const isSlotAvailable = docInfo.slots_booked[slotDate] && docInfo.slots_booked[slotDate].includes(slotTime) ? false : true;

        if (isSlotAvailable) {
          timeSlots.push({
            datetime: new Date(currentDate),
            time: formattedTime
          });
        }

        currentDate.setMinutes(currentDate.getMinutes() + 30);
      }

      setDocSlots(prev => ([...prev, timeSlots]));
    }
  };

  const validateBooking = () => {
    if (!docSlots[slotIndex]?.[0]?.datetime) {
      setValidationError('Please select an appointment date');
      toast.warn('Please select an appointment date');
      return false;
    }
    if (!slotTime) {
      setValidationError('Please select an appointment time');
      toast.warn('Please select an appointment time');
      return false;
    }
    setValidationError('');
    return true;
  };

  const bookappointment = async () => {
    if (!token) {
      toast.warn('Login to Book Appointment');
      return navigate('/login');
    }
    if (!userdata.isAccountverified) {
      toast.warn('Please Verify Your Account');
      return navigate('/');
    }

    if (!validateBooking()) {
      return;
    }

    setIsLoading(true);
    try {
      const date = docSlots[slotIndex][0].datetime;

      let day = date.getDate();
      let month = date.getMonth() + 1;
      let year = date.getFullYear();

      const slotDate = day + '_' + month + '_' + year;

      setLoadingStep(0);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setLoadingStep(1);
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { data } = await axios.post(
        backendurl + '/api/user/book-appointment',
        { docId, slotDate, slotTime },
        { headers: { token } }
      );

      setLoadingStep(2);
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (data.success) {
        toast.success(data.message);
        getdoctorsdata();
        navigate('/my-appointments');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  useEffect(() => {
    fetchDocInfo();
  }, [doctors, docId]);

  useEffect(() => {
    if (docInfo) {
      getAvailableSlots();
    }
  }, [docInfo]);

  useEffect(() => {
    setValidationError('');
  }, [slotIndex, slotTime]);

  if (isLoading) {
    return <LoadingState step={loadingStep} />;
  }

  return docInfo && (
    <div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div>
          <img className="bg-green-300 w-full sm:max-w-72 rounded-lg" src={docInfo.image} alt="" />
        </div>
        <div className="flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0">
          <p className="flex items-center gap-2 text-2xl font-medium text-gray-900">
            {docInfo.name} <img className="w-5" src={assets.verified_icon} alt="Verified" />
          </p>
          <div className="flex items-center gap-2 text-sm mt-1 text-gray-600">
            <p>{docInfo.degree} - {docInfo.speciality}</p>
            <button className="py-0 px-2 border text-xs rounded-full bg-green-100 hover:bg-green-200">{docInfo.experience}</button>
          </div>
          <div>
            <p className="flex items-center gap-1 text-sm font-medium text-gray-900 mt-3">
              About <img src={assets.info_icon} alt="Info" />
            </p>
            <p className="text-sm text-gray-500 max-w-[700px] mt-1">{docInfo.about}</p>
          </div>
          <p className="text-gray-500 font-medium mt-4">
            Approx Treatment Fee: ₹<span className="text-gray-600">{docInfo.fees ? docInfo.fees : 'N/A'}</span>
          </p>
          <div className="flex gap-4">
            {docInfo.address?.Location && (
              <p className="text-gray-500 font-medium mt-4 border pr-3 pl-3 rounded-full bg-green-100 hover:bg-green-200 cursor-pointer">
                <span className="text-gray-600">{docInfo.address.Location}</span>
              </p>
            )}
            {docInfo.address?.line && (
              <p className="text-gray-500 font-medium mt-4 border pr-3 pl-3 rounded-full bg-green-100 hover:bg-green-200 cursor-pointer">
                <span className="text-gray-600">{docInfo.address.line}</span>
              </p>
            )}
          </div>
          <div className="pr-4 sm:pr-6 md:pr-36 text-gray-600 text-sm sm:text-base">
            {docInfo.address?.line && (
              <p className="text-gray-500 font-medium mt-4 border px-4 py-2 sm:px-6 sm:py-3 rounded-xl bg-green-100 hover:bg-green-200 cursor-pointer transition duration-300 hover:scale-10 w-full max-w-full overflow-hidden">
                <span className="text-gray-600 text-sm sm:text-base">{docInfo.full_address}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700">
        <p>Booking Slots</p>
        <div className="flex gap-3 items-center w-full overflow-x-scroll mt-4">
          {docSlots.map((item, index) => (
            <div
              key={index}
              onClick={() => setSlotIndex(index)}
              className={`text-center py-6 min-w-16 rounded-full cursor-pointer hover:bg-primary hover:text-white ${
                slotIndex === index ? 'bg-primary text-white' : 'border border-gray-200'
              }`}
            >
              <p>{item[0]?.datetime ? daysofWeek[item[0].datetime.getDay()] : 'N/A'}</p>
              <p>{item[0]?.datetime ? item[0].datetime.getDate() : 'N/A'}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full overflow-x-scroll mt-4">
          {docSlots.length &&
            docSlots[slotIndex]
              ?.filter((item) => item)
              .map((item, index) => (
                <p
                  key={index}
                  onClick={() => setSlotTime(item.time)}
                  className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer hover:bg-primary hover:text-white ${
                    item.time === slotTime
                      ? 'bg-primary text-white'
                      : 'text-gray-400 border border-green-400'
                  }`}
                >
                  {item.time.toLowerCase()}
                </p>
              ))}
        </div>

        <div className="flex flex-col items-start">
          <button
            onClick={bookappointment}
            className={`text-white text-sm font-light px-10 py-3 rounded-full my-6 ${
              !slotTime || !docSlots[slotIndex]?.[0]?.datetime
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary hover:bg-green-400 cursor-pointer'
            }`}
            disabled={!slotTime || !docSlots[slotIndex]?.[0]?.datetime}
          >
            Book an Appointment
          </button>
          
          {validationError && (
            <p className="text-sm text-red-500 ml-2 -mt-4 mb-4">{validationError}</p>
          )}
        </div>
      </div>
      
      <ReleatedDoctors
        docId={docId}
        speciality={docInfo.speciality}
        location={docInfo.address.Location}
        State={docInfo.address.line}
      />
    </div>
  );
};

export default Appointments;