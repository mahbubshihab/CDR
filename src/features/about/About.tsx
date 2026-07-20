import React, { useState } from 'react';
import { 
  HelpCircle, BookOpen, Keyboard, ShieldAlert, Cpu, 
  Database, Smartphone, Search, MapPin, Compass, Settings, 
  Languages, FileSpreadsheet, Activity, UserCheck
} from 'lucide-react';

type Language = 'en' | 'bn';
type Tab = 'overview' | 'analysis' | 'hardware' | 'settings';

export const About: React.FC = () => {
  const [lang, setLang] = useState<Language>('bn');
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const content = {
    en: {
      title: 'Guide & Support',
      subtitle: 'Complete Operational Manual and Forensic System Guide',
      tabs: {
        overview: 'Overview & Ingestion',
        analysis: 'Analysis Modules',
        hardware: 'Hardware & IMEI',
        settings: 'Shortcuts & Config'
      },
      common: {
        version: 'System Version',
        privacyTitle: 'Forensic Integrity & Privacy',
        privacyText: 'All operations are completed 100% locally in your browser\'s IndexedDB. No files or database records are sent to any remote server, ensuring absolute privacy of telecommunication logs.',
      },
      overview: {
        introTitle: '1. Platform Introduction',
        introText: 'CDR Analyzer Platform is designed for rapid parser normalization and synchronized telecommunication analysis of multiple operators (Grameenphone, Banglalink, Robi, Teletalk). It translates raw carrier logs into a structured database.',
        ingestTitle: '2. Case Ingestion & Uploads',
        ingestDesc: 'Before analyzing, create a forensic Case Profile specifying Investigator, Police Station, and Case ID. Once created, you can upload Excel (.xlsx) or CSV files.',
        operatorTitle: '3. Operator Format Normalization',
        operatorDesc: 'The system automatically recognizes differences in header structures, carrier formats, and timestamp strings. It normalizes all timestamps to standard formats case-insensitively, handling various cell parameters seamlessly.'
      },
      analysis: {
        execTitle: '1. Executive Dashboard',
        execDesc: 'Provides key metrics of the selected suspect number, including peak cell tower transition lists, Daily Activity Trendlines (interactive monthly timelines), and suspect operator distributions.',
        advTitle: '2. Advanced Analysis & Querying',
        advDesc: 'Supports complex querying of records. Filter dynamically by B-Party (recipient) numbers, specific locations, IMEI codes, time ranges, and duration thresholds.',
        mfcTitle: '3. Cell Tower & Location Mapping',
        mfcDesc: 'Visualize suspect movements and geographical transitions. MFC tower records map suspect coordinates to locations, allowing tracing of geographic boundaries without manual calculations.'
      },
      hardware: {
        imeiTitle: '1. IMEI / IMSI Summary',
        imeiDesc: 'Lists all device hardware codes (IMEI) and SIM card identity codes (IMSI) used by the target suspect number. It shows details of target phone profile records.',
        swapTitle: '2. SIM & Hardware Swaps',
        swapDesc: 'Easily track frequency of SIM card swaps on target hardware, and first/last contact durations. Any swap of hardware is recorded and flagged in the analysis summaries.'
      },
      settings: {
        shortcutsTitle: 'System Keyboard Shortcuts',
        shortcutList: [
          { name: 'Global Search', keys: 'Ctrl + K' },
          { name: 'Register New Case', keys: 'Alt + N' },
          { name: 'Upload CDR Log File', keys: 'Alt + U' },
          { name: 'Close Modals / Dialogs', keys: 'Esc' }
        ],
        ownershipTitle: 'Ownership & Registry Lookups',
        ownershipDesc: 'Under the Ownership Finder tab, verify national identification registry details (NID/CNIC) associated with the target suspects. Database settings handle customizable lookup flags.'
      }
    },
    bn: {
      title: 'গাইড এন্ড সাপোর্ট',
      subtitle: 'সিডিআর ফরেনসিক প্ল্যাটফর্মের নির্দেশিকা ও সিস্টেম ব্যবহারবিধি',
      tabs: {
        overview: 'পরিচিতি ও আপলোড',
        analysis: 'অ্যানালাইসিস মডিউল',
        hardware: 'ডিভাইস ও আইএমইআই',
        settings: 'শর্টকাট ও সেটিংস'
      },
      common: {
        version: 'সিস্টেম ভার্সন',
        privacyTitle: 'ডেটা নিরাপত্তা ও গোপনীয়তা',
        privacyText: 'সিডিআর ফাইল পার্সিং এবং সংরক্ষণের সমস্ত কাজ সম্পূর্ণ লোকাল ব্রাউজারের IndexedDB-তে সম্পন্ন হয়। কোনো ক্লাউড সার্ভার ব্যবহার করা হয় না, যা সিডিআর তদন্তের নিরাপত্তা ও শতভাগ গোপনীয়তা নিশ্চিত করে।',
      },
      overview: {
        introTitle: '১. প্ল্যাটফর্ম পরিচিতি',
        introText: 'সিডিআর ফরেনসিক প্ল্যাটফর্মটি বাংলালিংক, গ্রামীণফোন, রবি ও টেলিটক অপারেটরের সিডিআর ফাইলগুলোর ভিন্ন ভিন্ন স্ট্রাকচার বিশ্লেষণ করে একটি সুসংগঠিত ডেটাবেস তৈরি করে।',
        ingestTitle: '২. কেস তৈরি ও ফাইল আপলোড',
        ingestDesc: 'তদন্ত শুরু করতে প্রথমে একটি নতুন কেস প্রোফাইল তৈরি করুন যেখানে ইনভেস্টিগেটর নাম, থানা ও কেস আইডি উল্লেখ থাকবে। এরপর এক্সেল (.xlsx) বা সিএসভি (.csv) ফাইল আপলোড করুন।',
        operatorTitle: '৩. অপারেটর ফাইল নরমালাইজেশন',
        operatorDesc: 'সিস্টেমটি আপলোডকৃত ফাইলের হেডার ও অপারেটরের ধরন (বাংলালিংক, রবি, টেলিটক, গ্রামীণফোন) নিজে থেকেই ডিটেক্ট করে এবং টাইমস্ট্যাম্প ও সেল ইনফরমেশন নরমালাইজ করে।'
      },
      analysis: {
        execTitle: '১. এক্সিকিউটিভ ড্যাশবোর্ড',
        execDesc: 'সন্দেহভাজন নম্বরের অ্যাক্টিভিটি ট্রিকস, যেমন দিনভিত্তিক কলের সংখ্যা (Daily Trendline), সর্বাধিক ব্যবহৃত সেল টাওয়ার ট্রানজিশন এবং অপারেটর ডিস্ট্রিবিউশন একনজরে প্রদর্শন করে।',
        advTitle: '২. অ্যাডভান্সড সিডিআর অ্যানালাইসিস',
        advDesc: 'নির্দিষ্ট কোনো বি-পার্টি (রিসিভার) নম্বর, লোকেশন, আইএমইআই কোড বা নির্দিষ্ট সময় ও ব্যাপ্তির ওপর ভিত্তি করে সিডিআর লগগুলো ডাইনামিক ফিল্টার করতে সহায়তা করে।',
        mfcTitle: '৩. সেল টাওয়ার লোকেশন ম্যাপিং',
        mfcDesc: 'সিডিআর ফাইলে উল্লিখিত সেল আইডি ও টাওয়ার লোকেশন কোড ব্যবহার করে সন্দেহভাজনের ভৌগোলিক গতিবিধি এবং লোকেশন সিকোয়েন্স দৃশ্যমান করে।'
      },
      hardware: {
        imeiTitle: '১. আইএমইআই এবং আইএমএসআই সামারি',
        imeiDesc: 'লক্ষ্যবস্তু নম্বরের ব্যবহৃত সমস্ত হ্যান্ডসেট হার্ডওয়্যার কোড (IMEI) এবং সিম কার্ড কোড (IMSI) তালিকাভুক্ত করে এবং প্রতিটির রেকর্ড কাউন্ট দেখায়।',
        swapTitle: '২. সিম ও হ্যান্ডসেট পরিবর্তন ট্র্যাকিং',
        swapDesc: 'একটি হ্যান্ডসেটে কতবার সিম পরিবর্তন করা হয়েছে অথবা একটি সিম কতটি ভিন্ন ডিভাইসে ব্যবহার করা হয়েছে তা ফার্স্ট ও লাস্ট কন্টাক্ট ডিউরেশনসহ ডিটেক্ট করে।'
      },
      settings: {
        shortcutsTitle: 'সিস্টেম কীবোর্ড শর্টকাট',
        shortcutList: [
          { name: 'গ্লোবাল সার্চ বার', keys: 'Ctrl + K' },
          { name: 'নতুন কেস প্রোফাইল তৈরি', keys: 'Alt + N' },
          { name: 'সিডিআর ফাইল আপলোড মডাল', keys: 'Alt + U' },
          { name: 'মডাল বা পপআপ বন্ধ করা', keys: 'Esc' }
        ],
        ownershipTitle: 'ওনারশিপ এবং এনআইডি অনুসন্ধান',
        ownershipDesc: 'ওনারশিপ ফাইন্ডার মডিউল ব্যবহার করে সন্দেহভাজন নম্বরের জাতীয় পরিচয়পত্র (NID/CNIC) ও মালিকানার বিবরণ অনুসন্ধান এবং ক্রস-কেস রেফারেন্স যাচাই করা যায়।'
      }
    }
  };

  const t = content[lang];

  return (
    <div className="w-full h-full flex flex-col p-6 text-left bg-[#0f0f11] animate-in fade-in duration-300 overflow-y-auto">
      {/* Header with Bilingual Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#232326] pb-6 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <BookOpen className="h-5.5 w-5.5 text-[#3ecf8e]" />
            {t.title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1.5 font-sans">
            {t.subtitle}
          </p>
        </div>

        {/* Language selector toggle */}
        <div className="flex items-center gap-2 bg-[#1b1b1f] border border-[#27272a] p-1.5 rounded-xl shrink-0 self-start sm:self-center">
          <Languages className="h-4 w-4 text-gray-400 mr-1" />
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
              lang === 'en' 
                ? 'bg-[#3ecf8e]/10 border border-[#3ecf8e]/35 text-[#3ecf8e]' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLang('bn')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
              lang === 'bn' 
                ? 'bg-[#3ecf8e]/10 border border-[#3ecf8e]/35 text-[#3ecf8e]' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            বাংলা
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-2 border-b border-[#232326]/60 pb-4 mb-6">
        {(Object.keys(t.tabs) as Tab[]).map((tabId) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 text-xs font-medium rounded-xl border cursor-pointer transition-all duration-150 ${
              activeTab === tabId
                ? 'bg-[#2a2a2f] border-[#3f3f46] text-white'
                : 'bg-transparent border-[#232326] text-gray-450 hover:bg-[#1c1c1e] hover:text-white'
            }`}
          >
            {t.tabs[tabId]}
          </button>
        ))}
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-[#141416] border border-[#27272a] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-3">
                <Database className="h-4.5 w-4.5 text-[#3ecf8e]" />
                {t.overview.introTitle}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-sans">
                {t.overview.introText}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#141416] border border-[#27272a] rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-3">
                  <FileSpreadsheet className="h-4.5 w-4.5 text-blue-400" />
                  {t.overview.ingestTitle}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-sans">
                  {t.overview.ingestDesc}
                </p>
              </div>

              <div className="bg-[#141416] border border-[#27272a] rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-3">
                  <Cpu className="h-4.5 w-4.5 text-purple-400" />
                  {t.overview.operatorTitle}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-sans">
                  {t.overview.operatorDesc}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Analysis Modules */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="bg-[#141416] border border-[#27272a] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-3">
                <Activity className="h-4.5 w-4.5 text-yellow-400" />
                {t.analysis.execTitle}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-sans">
                {t.analysis.execDesc}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#141416] border border-[#27272a] rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-3">
                  <Search className="h-4.5 w-4.5 text-[#3ecf8e]" />
                  {t.analysis.advTitle}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-sans">
                  {t.analysis.advDesc}
                </p>
              </div>

              <div className="bg-[#141416] border border-[#27272a] rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-3">
                  <MapPin className="h-4.5 w-4.5 text-orange-400" />
                  {t.analysis.mfcTitle}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-sans">
                  {t.analysis.mfcDesc}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Hardware */}
        {activeTab === 'hardware' && (
          <div className="space-y-6">
            <div className="bg-[#141416] border border-[#27272a] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-3">
                <Smartphone className="h-4.5 w-4.5 text-pink-400" />
                {t.hardware.imeiTitle}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-sans">
                {t.hardware.imeiDesc}
              </p>
            </div>

            <div className="bg-[#141416] border border-[#27272a] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-3">
                <Cpu className="h-4.5 w-4.5 text-[#3ecf8e]" />
                {t.hardware.swapTitle}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-sans">
                {t.hardware.swapDesc}
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Shortcuts */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#141416] border border-[#27272a] rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <Keyboard className="h-4.5 w-4.5 text-blue-400" />
                {t.settings.shortcutsTitle}
              </h3>
              <ul className="space-y-3 font-mono text-xs sm:text-sm">
                {t.settings.shortcutList.map((sc, i) => (
                  <li key={i} className="flex justify-between items-center text-gray-400">
                    <span className="font-sans text-xs">{sc.name}</span>
                    <kbd className="px-2 py-0.5 bg-[#27272a] rounded border border-[#3f3f46] text-gray-300 font-mono text-xs">{sc.keys}</kbd>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#141416] border border-[#27272a] rounded-xl p-6 space-y-3">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <UserCheck className="h-4.5 w-4.5 text-purple-400" />
                {t.settings.ownershipTitle}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-sans">
                {t.settings.ownershipDesc}
              </p>
            </div>
          </div>
        )}

        {/* Local Security & Version Info card */}
        <div className="bg-[#18181b]/40 border border-[#27272a] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 rounded-lg">
              <ShieldAlert className="h-5 w-5 text-[#3ecf8e]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-200">{t.common.privacyTitle}</h3>
              <p className="text-[10px] font-mono text-gray-500 mt-0.5">{t.common.version}: v1.0.0-beta</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-sans">
            {t.common.privacyText}
          </p>
        </div>
      </div>
    </div>
  );
};
