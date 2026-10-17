import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase'; // تأكد من تصدير auth من ملف firebase.js
import {  
  collection,  
  addDoc,  
  onSnapshot,  
  deleteDoc,  
  doc,  
  serverTimestamp  
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import {  
  Package,  
  Plane,  
  FileText,  
  MapPin,  
  Calendar,  
  Scale,  
  Phone,  
  PlusCircle,  
  Trash2,  
  Send,  
  UserCheck,  
  AlertCircle,
  LogIn,
  LogOut,
  Lock,
  Heart
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('traveler'); // 'traveler' or 'sender'
  
  // بيانات المستخدم الحالي في Firebase Auth
  const [user, setUser] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // بيانات الرحلات والطلبات
  const [trips, setTrips] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);

  // نماذج الإدخال
  const [tripForm, setTripForm] = useState({
    travelDate: '',
    pickupEgypt: 'القاهرة',
    deliverSyria: 'دمشق',
    phone: '',
    maxWeight: '5',
    papersOnly: false
  });

  const [parcelForm, setParcelForm] = useState({
    itemType: 'papers', // 'papers' or 'package'
    weight: '1',
    pickupEgypt: 'القاهرة',
    deliverSyria: 'دمشق',
    targetDate: '',
    phone: '',
    notes: ''
  });

  // مراقبة حالة تسجيل الدخول
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  // التزامن اللحظي مع الفايربيز
  useEffect(() => {
    const unsubscribeTrips = onSnapshot(collection(db, 'trips'), (snapshot) => {
      const tripsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      tripsData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setTrips(tripsData);
      setLoading(false);
    }, (error) => {
      console.error("خطأ في جلب الرحلات:", error);
      setLoading(false);
    });

    const unsubscribeParcels = onSnapshot(collection(db, 'parcels'), (snapshot) => {
      const parcelsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      parcelsData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setParcels(parcelsData);
    }, (error) => {
      console.error("خطأ في جلب الطلبات:", error);
    });

    return () => {
      unsubscribeTrips();
      unsubscribeParcels();
    };
  }, []);

  // دوال المصادقة
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        alert('تم إنشاء الحساب وتسجيل الدخول بنجاح!');
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        alert('تم تسجيل الدخول بنجاح!');
      }
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
    } catch (err) {
      console.error("خطأ في المصادقة:", err);
      alert('حدث خطأ: تأكد من صحة البريد أو كلمة المرور (يجب أن تكون 6 أحرف على الأقل).');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert('تم تسجيل الخروج بنجاح.');
    } catch (err) {
      console.error("خطأ في تسجيل الخروج:", err);
    }
  };

  // إضافة رحلة جديدة (محمية)
  const handleAddTrip = async (e) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      await addDoc(collection(db, 'trips'), {
        travelDate: tripForm.travelDate,
        pickupEgypt: tripForm.pickupEgypt,
        deliverSyria: tripForm.deliverSyria,
        phone: tripForm.phone,
        maxWeight: tripForm.papersOnly ? 0 : Number(tripForm.maxWeight),
        papersOnly: tripForm.papersOnly,
        userId: user.uid,
        userEmail: user.email,
        createdAt: serverTimestamp()
      });
      alert('تمت إضافة رحلتك بنجاح!');
      setTripForm({ travelDate: '', pickupEgypt: 'القاهرة', deliverSyria: 'دمشق', phone: '', maxWeight: '5', papersOnly: false });
    } catch (err) {
      console.error("خطأ في الإضافة:", err);
      alert('حدث خطأ أثناء إضافة الرحلة.');
    }
  };

  // إضافة طلب جديد (محمية)
  const handleAddParcel = async (e) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      await addDoc(collection(db, 'parcels'), {
        itemType: parcelForm.itemType,
        weight: parcelForm.itemType === 'papers' ? 0 : Number(parcelForm.weight),
        pickupEgypt: parcelForm.pickupEgypt,
        deliverSyria: parcelForm.deliverSyria,
        targetDate: parcelForm.targetDate,
        phone: parcelForm.phone,
        notes: parcelForm.notes,
        status: 'pending',
        userId: user.uid,
        userEmail: user.email,
        createdAt: serverTimestamp()
      });
      alert('تم إرسال طلبك بنجاح!');
      setParcelForm({ itemType: 'papers', weight: '1', pickupEgypt: 'القاهرة', deliverSyria: 'دمشق', targetDate: '', phone: '', notes: '' });
    } catch (err) {
      console.error("خطأ في الإضافة:", err);
      alert('حدث خطأ أثناء إضافة الطلب');
    }
  };

  // حذف الرحلة أو الطلب (فقط لصاحب العنصر)
  const handleDelete = async (collectionName, item) => {
    if (!user) {
      alert('يجب تسجيل الدخول أولاً لحذف طلبك.');
      setShowAuthModal(true);
      return;
    }
    if (item.userId && item.userId !== user.uid) {
      alert('عذراً، يمكنك حذف طلباتك الخاصة فقط.');
      return;
    }
    if (window.confirm("هل أنت متأكد من الحذف؟")) {
      try {
        await deleteDoc(doc(db, collectionName, item.id));
      } catch (err) {
        console.error("خطأ في الحذف:", err);
        alert("لم نتمكن من الحذف");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between" dir="rtl">
      <div>
        {/* الهيدر الرئيسي المحسّن */}
        <header className="bg-emerald-700 text-white shadow-lg py-5 px-4 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* الشعار والعنوان */}
            <div className="flex items-center gap-3 text-center md:text-right">
              <div className="p-2.5 bg-emerald-600 rounded-2xl shadow-inner border border-emerald-500 flex-shrink-0">
                <Plane className="w-7 h-7 text-emerald-100" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">منصة سند (مصر ⇆ سوريا)</h1>
                <p className="text-emerald-200 text-xs md:text-sm mt-0.5">تنسيق النقل السريع للوثائق والأغراض بين المسافرين والأهالي</p>
              </div>
            </div>

            {/* أدوات التحكم وعناصر الحساب */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              
              {/* أزرار التنقل بين اللوحات */}
              <div className="flex bg-emerald-800/80 p-1 rounded-xl border border-emerald-600/60 w-full sm:w-auto justify-center">
                <button
                  onClick={() => setActiveTab('traveler')}
                  className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all w-1/2 sm:w-auto ${
                    activeTab === 'traveler'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-emerald-100 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  لوحة المسافر
                </button>
                <button
                  onClick={() => setActiveTab('sender')}
                  className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all w-1/2 sm:w-auto ${
                    activeTab === 'sender'
                      ? 'bg-white text-emerald-800 shadow-md'
                      : 'text-emerald-100 hover:text-white'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  لوحة المرسل
                </button>
              </div>

              {/* زر أو معلومات الحساب */}
              {user ? (
                <div className="flex items-center justify-between sm:justify-start gap-2 bg-emerald-800/60 px-3 py-1.5 rounded-xl border border-emerald-600/50 w-full sm:w-auto">
                  <span className="text-xs text-emerald-100 truncate max-w-[150px]">{user.email}</span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-xs bg-red-600/90 hover:bg-red-600 text-white px-2.5 py-1 rounded-lg transition-colors flex-shrink-0"
                    title="تسجيل الخروج"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    خروج
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center justify-center gap-2 bg-white text-emerald-800 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold shadow-sm hover:bg-emerald-50 transition-all w-full sm:w-auto"
                >
                  <LogIn className="w-4 h-4 text-emerald-700" />
                  تسجيل الدخول
                </button>
              )}

            </div>
          </div>
        </header>

        {/* نافذة تسجيل الدخول المنبثقة Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-emerald-800">
                  {isRegistering ? 'إنشاء حساب جديد' : 'تسجيل الدخول للنشر والحذف'}
                </h3>
                <button 
                  onClick={() => setShowAuthModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">كلمة المرور</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
                >
                  {isRegistering ? 'إنشاء حساب وتسجيل' : 'دخول'}
                </button>
                <div className="text-center mt-3">
                  <button
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-xs text-emerald-700 hover:underline font-medium"
                  >
                    {isRegistering ? 'لديك حساب بالفعل؟ سجل دخولك' : 'ليس لديك حساب؟ إنشاء حساب جديد'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* المحتوى الرئيسي */}
        <main className="max-w-5xl mx-auto p-4 md:p-6 my-6">
          {/* صندوق تنبيهات المنصة للمستخدمين */}
          <div className="mb-8 p-4 bg-amber-50 border-r-4 border-amber-500 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <h3 className="font-bold text-amber-900 text-base">تنبيهات المنصة للمستخدمين</h3>
            </div>
            <ul className="text-sm text-amber-900 leading-relaxed space-y-1.5 list-disc list-inside pr-1">
              <li>
                <strong>القوانين والسلامة:</strong> يرجى التأكد التام من مطابقة محتويات الأوراق والطرود للقوانين والتعليمات الجمركية والأمنية في مصر وسوريا. النشر يتطلب تسجيل الدخول لضمان الموثوقية.
              </li>
              <li>
                <strong>إخلاء المسؤولية:</strong> المنصة مجرد وسيلة لتنسيق التواصل، وغير مسؤولة عن عمليات الاستلام والتسليم بين الأطراف.
              </li>
            </ul>
          </div>

          {/* 1. لوحة تحكم المسافر */}
          {activeTab === 'traveler' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* نموذج إضافة رحلة */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
                <h2 className="text-xl font-bold mb-4 text-emerald-800 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5" />
                  إضافة رحلة جديدة
                </h2>
                
                {!user && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>عليك تسجيل الدخول لتتمكن من إضافة رحلة.</span>
                  </div>
                )}

                <form onSubmit={handleAddTrip} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">تاريخ السفر</label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={tripForm.travelDate}
                        onChange={e => setTripForm({...tripForm, travelDate: e.target.value})}
                        className="w-full p-2.5 pl-9 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                      />
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">مكان الاستلام في مصر</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: القاهرة - العتبة / مدينة نصر"
                      value={tripForm.pickupEgypt}
                      onChange={e => setTripForm({...tripForm, pickupEgypt: e.target.value})}
                      className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">مكان التسليم في سوريا</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: دمشق - البرامكة / حمص"
                      value={tripForm.deliverSyria}
                      onChange={e => setTripForm({...tripForm, deliverSyria: e.target.value})}
                      className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    />
                  </div>

                  {/* خيار حجز أوراق فقط */}
                  <div className="flex items-center gap-2 p-2 bg-slate-50 border rounded-xl">
                    <input
                      type="checkbox"
                      id="papersOnly"
                      checked={tripForm.papersOnly}
                      onChange={e => setTripForm({...tripForm, papersOnly: e.target.checked})}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="papersOnly" className="text-sm font-medium text-slate-700 cursor-pointer">
                      حجز لأوراق ومستندات فقط 📄
                    </label>
                  </div>

                  {/* إخفاء حقل الوزن إذا كانت الرحلة مخصصة للأوراق فقط */}
                  {!tripForm.papersOnly && (
                    <div>
                      <label className="block text-sm font-medium mb-1">الوزن المتاح للنقل (كجم)</label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        required
                        value={tripForm.maxWeight}
                        onChange={e => setTripForm({...tripForm, maxWeight: e.target.value})}
                        className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">رقم التواصل (واتساب)</label>
                    <input
                      type="tel"
                      required
                      placeholder="+201..."
                      value={tripForm.phone}
                      onChange={e => setTripForm({...tripForm, phone: e.target.value})}
                      className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 mt-2"
                  >
                    <Plane className="w-5 h-5" />
                    {user ? 'نشر موعد الرحلة' : 'سجل دخول أولاً للنشر'}
                  </button>
                </form>
              </div>

              {/* قوائم الأغراض المطلوب نقلها */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600" />
                  أغراض وأوراق تنتظر مسافراً
                </h2>

                {loading ? (
                  <div className="bg-white p-8 text-center rounded-2xl border text-slate-500">جاري تحميل البيانات...</div>
                ) : parcels.length === 0 ? (
                  <div className="bg-white p-8 text-center rounded-2xl border text-slate-500">
                    لا توجد طرود أو أوراق معروضة للنقل حالياً.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {parcels.map((parcel) => (
                      <div key={parcel.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              parcel.itemType === 'papers' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {parcel.itemType === 'papers' ? '📄 أوراق ووثائق' : '📦 طرد/حاجة أخرى'}
                            </span>
                            {parcel.itemType !== 'papers' && parcel.weight > 0 && (
                              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                {parcel.weight} كجم
                              </span>
                            )}
                          </div>

                          <div className="space-y-2 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-emerald-600" />
                              <span><strong>من:</strong> {parcel.pickupEgypt}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-red-500" />
                              <span><strong>إلى:</strong> {parcel.deliverSyria}</span>
                            </div>
                            {parcel.targetDate && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span>مطلوب قبل: {parcel.targetDate}</span>
                              </div>
                            )}
                            {parcel.notes && (
                              <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg mt-2 border">
                                ملاحظات: {parcel.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t flex justify-between items-center">
                          <a
                            href={`https://wa.me/${parcel.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-emerald-700"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            تواصل مع المرسل
                          </a>

                          {user && parcel.userId === user.uid && (
                            <button
                              onClick={() => handleDelete('parcels', parcel)}
                              className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                              title="حذف الطلب"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. لوحة تحكم المرسل */}
          {activeTab === 'sender' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* نموذج إضافة طرد/أوراق */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
                <h2 className="text-xl font-bold mb-4 text-emerald-800 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5" />
                  طلب نقل أوراق أو أغراض
                </h2>

                {!user && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>عليك تسجيل الدخول لتتمكن من إضافة طلب.</span>
                  </div>
                )}

                <form onSubmit={handleAddParcel} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">نوع المحتوى</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setParcelForm({...parcelForm, itemType: 'papers'})}
                        className={`p-2.5 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 ${
                          parcelForm.itemType === 'papers'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        أوراق ومستندات
                      </button>
                      <button
                        type="button"
                        onClick={() => setParcelForm({...parcelForm, itemType: 'package'})}
                        className={`p-2.5 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 ${
                          parcelForm.itemType === 'package'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <Package className="w-4 h-4" />
                        طرد / حاجة تانية
                      </button>
                    </div>
                  </div>

                  {/* إخفاء حقل الوزن عند اختيار "أوراق ومستندات" */}
                  {parcelForm.itemType !== 'papers' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">الوزن التقريبي (كجم)</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        required
                        value={parcelForm.weight}
                        onChange={e => setParcelForm({...parcelForm, weight: e.target.value})}
                        className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">مكان الاستلام في مصر</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: الجيزة - المهندسين"
                      value={parcelForm.pickupEgypt}
                      onChange={e => setParcelForm({...parcelForm, pickupEgypt: e.target.value})}
                      className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">مكان التسليم في سوريا</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: حلب / اللاذقية"
                      value={parcelForm.deliverSyria}
                      onChange={e => setParcelForm({...parcelForm, deliverSyria: e.target.value})}
                      className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">تاريخ وصول مفضل (اختياري)</label>
                    <input
                      type="date"
                      value={parcelForm.targetDate}
                      onChange={e => setParcelForm({...parcelForm, targetDate: e.target.value})}
                      className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">رقم الواتساب للتواصل</label>
                    <input
                      type="tel"
                      required
                      placeholder="+201..."
                      value={parcelForm.phone}
                      onChange={e => setParcelForm({...parcelForm, phone: e.target.value})}
                      className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">تفاصيل وملاحظات إضافية</label>
                    <textarea
                      rows="2"
                      placeholder="تفاصيل إضافية عن الطرد أو أوقات الاستلام..."
                      value={parcelForm.notes}
                      onChange={e => setParcelForm({...parcelForm, notes: e.target.value})}
                      className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 mt-2"
                  >
                    <Send className="w-5 h-5" />
                    {user ? 'نشر طلب النقل' : 'سجل دخول أولاً للنشر'}
                  </button>
                </form>
              </div>

              {/* الرحلات المتوفرة من المسافرين */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Plane className="w-5 h-5 text-emerald-600" />
                  رحلات المسافرين المتاحة
                </h2>

                {loading ? (
                  <div className="bg-white p-8 text-center rounded-2xl border text-slate-500">جاري تحميل البيانات...</div>
                ) : trips.length === 0 ? (
                  <div className="bg-white p-8 text-center rounded-2xl border text-slate-500">
                    لا توجد رحلات مسافرين معروضة حالياً.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trips.map((trip) => (
                      <div key={trip.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              موعد السفر: {trip.travelDate}
                            </span>
                            {!trip.papersOnly && trip.maxWeight > 0 && (
                              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded flex items-center gap-1">
                                <Scale className="w-3.5 h-3.5" />
                                متاح: {trip.maxWeight} كجم
                              </span>
                            )}
                          </div>

                          {/* شارة توضيحية إذا كانت الرحلة للأوراق فقط */}
                          {trip.papersOnly && (
                            <div className="mb-2">
                              <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-md font-semibold inline-flex items-center gap-1">
                                📄 مخصص للأوراق والمستندات فقط
                              </span>
                            </div>
                          )}

                          <div className="space-y-2 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-emerald-600" />
                              <span><strong>استلام بمصر:</strong> {trip.pickupEgypt}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-red-500" />
                              <span><strong>تسليم بسوريا:</strong> {trip.deliverSyria}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t flex justify-between items-center">
                          <a
                            href={`https://wa.me/${trip.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-emerald-700"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            تواصل مع المسافر
                          </a>

                          {user && trip.userId === user.uid && (
                            <button
                              onClick={() => handleDelete('trips', trip)}
                              className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                              title="حذف الرحلة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* الفوتر الرئيسي */}
      <footer className="bg-slate-900 text-slate-300 py-6 px-4 mt-12 border-t border-slate-800">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-right">
          <p className="flex items-center justify-center sm:justify-start gap-1.5 text-sm font-medium text-slate-200">
            صُنع بـ <Heart className="w-4 h-4 text-red-500 fill-red-500" /> من قبل د. يوسف النيفاوي
          </p>
          <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1">
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            للتواصل والدعم: 
            <a href="tel:01018526001" className="hover:text-emerald-400 font-mono text-xs transition-colors">
              01018526001
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}