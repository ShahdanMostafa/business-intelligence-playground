
import React, { useState, useCallback, useRef, useMemo } from 'react';
import { FormStep, BasicInfo, ExtractedData, AdditionalInfo, RegistrationRecord, Nationality, IdType } from './types';
import ProgressBar from './components/ProgressBar';
import AdminDashboard from './components/AdminDashboard';
import CameraView from './components/CameraView';
import { verifyAndExtractID } from './geminiService';
import { calculateEligibility } from './utils';

const App: React.FC = () => {
  const [step, setStep] = useState<FormStep>(FormStep.BASIC_INFO);
  const [basic, setBasic] = useState<BasicInfo>({ fullName: '', nationality: 'Egyptian', idType: 'Egyptian ID' });
  const [file, setFile] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [additional, setAdditional] = useState<AdditionalInfo>({ familySize: 1, educationLevel: 'University', employmentStatus: 'Unemployed', financialResponsibility: false });
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [records, setRecords] = useState<RegistrationRecord[]>([]);

  // Authentication State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const nameMismatch = useMemo(() => {
    if (!extracted || !basic.fullName) return false;
    return basic.fullName.toLowerCase().trim() !== extracted.fullName.toLowerCase().trim();
  }, [basic.fullName, extracted]);

  const handleBasicNext = () => {
    if (!basic.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    setError(null);
    setStep(FormStep.ID_UPLOAD);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFile(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleCameraCapture = (base64: string) => {
    setFile(base64);
    setIsCameraOpen(false);
    setError(null);
  };

  const processID = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const result = await verifyAndExtractID(file, basic.idType);
      
      if (!result.qualityCheck.isReadable) {
        setError(`Image rejected: ${result.qualityCheck.reason || "Please provide a clearer photo of your ID."}`);
        setIsProcessing(false);
        return;
      }

      // Duplicate ID Check
      const isDuplicate = records.some(record => record.extracted.idNumber === result.idNumber);
      if (isDuplicate) {
        setError("This ID has been recorded before, please wait for our call");
        setIsProcessing(false);
        return;
      }
      
      setExtracted(result);
      setStep(FormStep.VERIFICATION);
    } catch (err) {
      setError("Failed to process the document. Please try again.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const submitFinalForm = () => {
    if (!extracted) return;

    // Double check duplicates just before submission in case state changed
    const isDuplicate = records.some(record => record.extracted.idNumber === extracted.idNumber);
    if (isDuplicate) {
      setError("This ID has been recorded before, please wait for our call");
      setStep(FormStep.ID_UPLOAD);
      return;
    }

    const eligibility = calculateEligibility(basic, extracted);
    const newRecord: RegistrationRecord = {
      id: `TR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      basic,
      extracted,
      additional,
      eligibility,
      submittedAt: new Date().toISOString()
    };

    setRecords(prev => [...prev, newRecord]);
    setStep(FormStep.SUMMARY);
  };

  const resetForm = () => {
    setBasic({ fullName: '', nationality: 'Egyptian', idType: 'Egyptian ID' });
    setFile(null);
    setExtracted(null);
    setStep(FormStep.BASIC_INFO);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'AdminEntry') {
      setIsAdmin(true);
      setShowLoginModal(false);
      setStep(FormStep.DASHBOARD);
      setLoginError('');
      setAdminPassword('');
    } else {
      setLoginError('Invalid administrator credentials.');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setStep(FormStep.BASIC_INFO);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header with Role Toggle */}
        <div className="flex justify-between items-start mb-10">
          <div className="text-left">
            <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl tracking-tight">
              IntelliRegister
            </h1>
            <p className="mt-1 text-slate-600">
              AI-Powered Trainee Enrollment System
            </p>
          </div>
          <div className="flex space-x-2">
            {!isAdmin ? (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <span>Admin Login</span>
              </button>
            ) : (
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-lg text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-all"
              >
                <span>Logout Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Administrator Access</h3>
                  <button onClick={() => setShowLoginModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
                </div>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Verify Identity</label>
                    <input 
                      type="password" 
                      placeholder="Enter administrator access code" 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      autoFocus
                    />
                  </div>
                  {loginError && <p className="text-xs text-rose-500 font-medium">{loginError}</p>}
                  <button 
                    type="submit"
                    className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
                  >
                    Enter Dashboard
                  </button>
                </form>
                <p className="mt-6 text-xs text-slate-400 text-center leading-relaxed">
                  Only authorized personnel are permitted to view trainee biometric data and eligibility reports. 
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {step !== FormStep.DASHBOARD ? (
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-100">
            <div className="p-8">
              <ProgressBar currentStep={step} />

              {/* Step 0: Basic Identification */}
              {step === FormStep.BASIC_INFO && (
                <div className="space-y-6 step-transition">
                  <h2 className="text-xl font-bold text-slate-800">Section A: Basic Identification</h2>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="John Doe"
                        value={basic.fullName}
                        onChange={(e) => setBasic({...basic, fullName: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nationality</label>
                      <select
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={basic.nationality}
                        onChange={(e) => setBasic({...basic, nationality: e.target.value as Nationality})}
                      >
                        <option>Egyptian</option>
                        <option>Sudanese</option>
                        <option>Syrian</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Type of ID</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {['Egyptian ID', 'UNHCR ID', 'Passport'].map((t) => (
                          <button
                            key={t}
                            onClick={() => setBasic({...basic, idType: t as IdType})}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                              basic.idType === t 
                                ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm' 
                                : 'border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {error && <p className="text-sm text-rose-500 font-medium">{error}</p>}
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleBasicNext}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg transition-all"
                    >
                      Next Step
                    </button>
                  </div>
                </div>
              )}

              {/* Step 1: ID Upload / Camera */}
              {step === FormStep.ID_UPLOAD && (
                <div className="space-y-6 step-transition text-center">
                  <h2 className="text-xl font-bold text-slate-800 text-left">Section B: ID Document Capture</h2>
                  
                  {isCameraOpen ? (
                    <CameraView 
                      onCapture={handleCameraCapture} 
                      onClose={() => setIsCameraOpen(false)} 
                    />
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 transition-colors hover:bg-slate-100 min-h-[300px]">
                      {file ? (
                        <div className="relative">
                          <img src={file} className="max-h-64 rounded-lg shadow-md" alt="ID Preview" />
                          <button 
                            onClick={() => setFile(null)}
                            className="absolute -top-3 -right-3 bg-white text-rose-500 p-1.5 rounded-full shadow-lg hover:bg-rose-50"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="bg-blue-100 p-4 rounded-full mb-4">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <p className="text-slate-600 mb-6 font-medium">Please provide a clear photo of your {basic.idType}</p>
                          
                          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                            <button 
                              onClick={() => setIsCameraOpen(true)}
                              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center"
                            >
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Take Photo
                            </button>
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-lg font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center"
                            >
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                              Upload File
                            </button>
                          </div>
                        </>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileUpload}
                      />
                    </div>
                  )}
                  
                  {error && (
                    <div className="bg-rose-50 border border-rose-200 p-4 rounded-lg flex items-start space-x-3 text-left">
                      <span className="text-rose-500 font-bold mt-0.5">⚠️</span>
                      <p className="text-sm text-rose-700">{error}</p>
                    </div>
                  )}

                  {!isCameraOpen && (
                    <div className="flex justify-between items-center pt-4">
                      <button onClick={() => setStep(FormStep.BASIC_INFO)} className="text-slate-500 hover:text-slate-700 font-medium">Back</button>
                      <button
                        onClick={processID}
                        disabled={!file || isProcessing}
                        className={`px-8 py-2.5 rounded-lg font-bold shadow-lg transition-all ${
                          !file || isProcessing 
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isProcessing ? 'AI Agent Checking...' : 'Analyze Document'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Verification Result */}
              {step === FormStep.VERIFICATION && extracted && (
                <div className="space-y-6 step-transition">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">AI Extraction Result</h2>
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Verified</span>
                  </div>

                  {nameMismatch && (
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-bold text-amber-800 uppercase tracking-tight">Important Verification Alert</h3>
                          <div className="mt-1 text-sm text-amber-700 leading-relaxed">
                            <p>The name you entered (<strong>{basic.fullName}</strong>) does not match the name extracted from the ID (<strong>{extracted.fullName}</strong>).</p>
                            <p className="mt-1 font-medium italic">Please verify if this document belongs to you. This will be flagged for human review.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400 uppercase">Extracted Name</label>
                      <div className="flex items-center justify-between">
                        <p className={`font-medium ${nameMismatch ? 'text-amber-600 font-bold' : 'text-slate-900'}`}>{extracted.fullName}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${extracted.confidenceScores.fullName > 0.9 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {Math.round(extracted.confidenceScores.fullName * 100)}% Match
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400 uppercase">Date of Birth</label>
                      <div className="flex items-center justify-between">
                        <p className="text-slate-900 font-medium">{extracted.dob}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${extracted.confidenceScores.dob > 0.9 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {Math.round(extracted.confidenceScores.dob * 100)}% Match
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400 uppercase">ID Number</label>
                      <div className="flex items-center justify-between">
                        <p className="text-slate-900 font-medium">{extracted.idNumber}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${extracted.confidenceScores.idNumber > 0.9 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {Math.round(extracted.confidenceScores.idNumber * 100)}% Match
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400 uppercase">Document Class</label>
                      <p className="text-slate-900 font-medium capitalize">{extracted.documentType}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800">
                    <strong>AI Note:</strong> Data has been extracted with an average confidence of {Math.round((extracted.confidenceScores.fullName + extracted.confidenceScores.dob + extracted.confidenceScores.idNumber) / 3 * 100)}%. Any low-confidence fields will be highlighted for manual review after submission.
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <button onClick={() => setStep(FormStep.ID_UPLOAD)} className="text-slate-500 hover:text-slate-700 font-medium">Back to Capture</button>
                    <button
                      onClick={() => setStep(FormStep.ADDITIONAL_INFO)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg transition-all"
                    >
                      Confirm & Proceed
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Additional Info */}
              {step === FormStep.ADDITIONAL_INFO && (
                <div className="space-y-6 step-transition">
                  <h2 className="text-xl font-bold text-slate-800">Section C: Supplemental Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Family Size</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={additional.familySize}
                        onChange={(e) => setAdditional({...additional, familySize: parseInt(e.target.value) || 1})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Education Level</label>
                      <select
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={additional.educationLevel}
                        onChange={(e) => setAdditional({...additional, educationLevel: e.target.value})}
                      >
                        <option>Primary</option>
                        <option>Secondary</option>
                        <option>University</option>
                        <option>Post-graduate</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Employment Status</label>
                      <select
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={additional.employmentStatus}
                        onChange={(e) => setAdditional({...additional, employmentStatus: e.target.value})}
                      >
                        <option>Employed</option>
                        <option>Unemployed</option>
                        <option>Student</option>
                        <option>Retired</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-3 pt-6">
                      <input
                        type="checkbox"
                        id="financialResp"
                        className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        checked={additional.financialResponsibility}
                        onChange={(e) => setAdditional({...additional, financialResponsibility: e.target.checked})}
                      />
                      <label htmlFor="financialResp" className="text-sm font-medium text-slate-700">Financial responsibility for dependents?</label>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <button onClick={() => setStep(FormStep.VERIFICATION)} className="text-slate-500 hover:text-slate-700 font-medium">Back</button>
                    <button
                      onClick={submitFinalForm}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg transition-all"
                    >
                      Submit Registration
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Summary / Thank You */}
              {step === FormStep.SUMMARY && (
                <div className="space-y-8 step-transition text-center py-10">
                  <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-900">Registration Complete!</h2>
                  <p className="text-slate-600 max-w-md mx-auto">
                    Your application has been received. Our AI system has performed an initial eligibility screening and stored your data for final administrative approval.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                    <button
                      onClick={resetForm}
                      className="bg-white border border-slate-200 text-slate-700 px-8 py-3 rounded-xl font-bold hover:bg-slate-50 shadow-sm transition-all"
                    >
                      New Registration
                    </button>
                    {!isAdmin ? (
                      <button
                        onClick={() => setShowLoginModal(true)}
                        className="bg-slate-100 text-slate-600 px-8 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
                      >
                        Staff Only Dashboard
                      </button>
                    ) : (
                      <button
                        onClick={() => setStep(FormStep.DASHBOARD)}
                        className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 shadow-xl transition-all"
                      >
                        View Admin Dashboard
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Staff Dashboard View (Only accessible if isAdmin is true) */
          <div className="step-transition">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Administrator Review</h2>
              <button 
                onClick={() => setStep(FormStep.BASIC_INFO)}
                className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Registration
              </button>
            </div>
            {isAdmin ? (
              <AdminDashboard records={records} />
            ) : (
              <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-slate-100">
                <p className="text-slate-500">Access Denied. Please log in as an administrator.</p>
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="mt-4 bg-slate-900 text-white px-6 py-2 rounded-lg font-bold"
                >
                  Admin Login
                </button>
              </div>
            )}
          </div>
        )}

        <p className="text-center mt-12 text-slate-400 text-sm">
          Powered by Gemini 3 Flash. Built with React & Tailwind CSS.
        </p>
      </div>
    </div>
  );
};

export default App;
