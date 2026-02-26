// Import Third-party Dependencies
import { taggedString as tS } from "@nodesecure/i18n";

const cli = {
  executing_at: "تنفيذ node-secure في",
  min_nodejs_version: tS`يتطلب node-secure على الأقل Node.js ${0} للعمل! يرجى ترقية إصدار Node.js الخاص بك.`,
  no_dep_to_proceed: "لا توجد تبعيات للمتابعة!",
  successfully_written_json: tS`تم كتابة ملف النتائج بنجاح في: ${0}`,
  http_server_started: "تم تشغيل خادم HTTP على:",
  missingEnv: tS`متغير البيئة ${0} مفقود!`,
  stat: tS`${0} ${1} في ${2}`,
  error: {
    name: tS`اسم ${0}: ${1}`,
    message: tS`الرسالة: ${0}`,
    phase: tS`حدث الخطأ أثناء مرحلة ${0}`,
    statusCode: tS`رمز حالة HTTP: ${0}`,
    executionTime: tS`حدث الخطأ في ${0} أثناء التنفيذ`,
    stack: tS`المكدس: ${0}`
  },
  commands: {
    option_depth: "أقصى عمق للتبعيات لجلبه",
    option_output: "اسم ملف JSON الناتج",
    option_silent: "تفعيل الوضع الصامت الذي يعطل مؤشرات CLI",
    option_contacts: "قائمة جهات الاتصال للتمييز",
    option_verbose: "ضبط مستوى الـ log الخاص بالـ CLI على verbose، مما يجعل الـ CLI يولّد logs أكثر تفصيلاً.",
    strategy: "مصدر الثغرات للاستخدام",
    cwd: {
      desc: "تشغيل تحليل الأمان على دليل العمل الحالي",
      option_nolock: "تعطيل استخدام package-lock.json",
      option_full: "تفعيل التحليل الكامل للحزم في ملف package-lock.json"
    },
    from: {
      desc: "تشغيل تحليل الأمان على حزمة معينة من سجل npm",
      searching: tS`جاري البحث عن بيان '${0}' في سجل npm...`,
      fetched: tS`تم جلب بيان ${0} من npm في ${1}`
    },
    auto: {
      desc: "تشغيل تحليل الأمان على دليل العمل الحالي أو حزمة معينة وفتح واجهة الويب تلقائياً",
      option_keep: "الاحتفاظ بملف nsecure-result.json على النظام بعد التنفيذ"
    },
    open: {
      desc: "تشغيل خادم HTTP مع ملف JSON nsecure معين",
      option_port: "تحديد المنفذ",
      option_fresh_start: "تشغيل الخادم من الصفر، متجاهلاً أي ملف حمولة موجود",
      option_developer: "تشغيل الخادم في وضع المطور، مما يتيح التحديث التلقائي لمكونات HTML"
    },
    verify: {
      desc: "تشغيل تحليل متقدم كامل لحزمة npm معينة",
      option_json: "إخراج حمولة التحليل إلى stdout"
    },
    summary: {
      desc: "عرض نتائج التحليل",
      warnings: "التحذيرات"
    },
    lang: {
      desc: "تكوين اللغة الافتراضية لـ CLI",
      question_text: "ما اللغة التي تريد استخدامها؟",
      new_selection: tS`تم اختيار '${0}' كلغة جديدة لـ CLI!`
    },
    scorecard: {
      desc: "عرض بطاقة أداء OSSF لمستودع معين أو دليل العمل الحالي (GitHub فقط، مثال: fastify/fastify)",
      option_vcs: "منصة التحكم في الإصدار (GitHub، GitLab)"
    },
    report: {
      desc: "إنشاء تقرير من حزمة",
      option_includesAllDeps: "تضمين جميع التبعيات",
      option_theme: "سمة التقرير ('dark'، 'light')",
      option_title: "عنوان التقرير",
      option_reporters: "قائمة المراسلين للاستخدام: 'html'، 'pdf'"
    },
    config: {
      desc: "تحرير ملف تكوين NodeSecure"
    },
    configCreate: {
      desc: "تهيئة ملف تكوين NodeSecure",
      option_cwd: "إنشاء ملف التكوين في دليل العمل الحالي"
    },
    cache: {
      desc: "إدارة ذاكرة التخزين المؤقت لـ NodeSecure",
      missingAction: "لم يتم تحديد إجراء صالح. استخدم --help لرؤية الخيارات.",
      option_list: "عرض ملفات ذاكرة التخزين المؤقت",
      option_clear: "مسح ذاكرة التخزين المؤقت",
      option_full: "مسح أو عرض ذاكرة التخزين المؤقت الكاملة، بما في ذلك الحمولات",
      cacheTitle: "ذاكرة التخزين المؤقت لـ NodeSecure:",
      scannedPayloadsTitle: "الحمولات الممسوحة المتاحة على القرص:",
      cleared: "تم مسح ذاكرة التخزين المؤقت بنجاح!"
    },
    extractIntegrity: {
      desc: "استخراج سلامة حزمة من بيانها وملف tarball ومقارنة السلامتين إذا كانتا مختلفتين.",
      missingSpecVersion: tS`يجب تحديد إصدار لحزمة '${0}'.`,
      invalidSpec: tS`مواصفات الحزمة '${0}' غير صالحة.`,
      specNotFound: tS`لم يتم العثور على مواصفات الحزمة '${0}' في سجل npm.`
    }
  },
  startHttp: {
    invalidScannerVersion: tS`تم فحص الحمولة بالإصدار '${0}' ولا تلبي نطاق CLI المطلوب '${1}'`,
    regenerate: "يرجى إعادة إنشاء حمولة JSON جديدة باستخدام CLI"
  }
};

const ui = {
  stats: {
    title: "الإحصائيات العامة",
    total_packages: "إجمالي الحزم",
    total_size: "الحجم الإجمالي",
    indirect_deps: "الحزم ذات التبعيات غير المباشرة",
    extensions: "الامتدادات",
    licenses: "التراخيص",
    maintainers: "المشرفون"
  },
  package_info: {
    navigation: {
      overview: "نظرة عامة",
      files: "الملفات",
      dependencies: "البرامج النصية والتبعيات",
      warnings: "التهديدات في الكود المصدري",
      vulnerabilities: "الثغرات الأمنية (CVE)",
      licenses: "مطابقة التراخيص (SPDX)",
      dark: "داكن",
      light: "فاتح"
    },
    title: {
      maintainers: "المشرفون",
      releases: "الإصدارات",
      files: "الملفات",
      files_extensions: "امتدادات الملفات",
      unused_deps: "التبعيات غير المستخدمة",
      missing_deps: "التبعيات المفقودة",
      minified_files: "الملفات المضغوطة",
      node_deps: "تبعيات node.js",
      third_party_deps: "تبعيات الطرف الثالث",
      required_files: "الملفات المطلوبة",
      used_by: "مستخدم بواسطة",
      openSsfScorecard: "بطاقة أداء الأمان"
    },
    overview: {
      homepage: "الصفحة الرئيسية",
      author: "المؤلف",
      size: "الحجم على النظام",
      dependencies: "عدد التبعيات",
      files: "عدد الملفات",
      tsTypings: "تعريفات TS",
      node: "توافق Node.js",
      npm: "توافق NPM",
      type: "نوع الوحدة",
      lastReleaseVersion: "إصدار آخر إصدار",
      lastReleaseDate: "تاريخ آخر إصدار",
      publishedReleases: "عدد الإصدارات المنشورة",
      numberPublishers: "عدد الناشرين",
      weeklyDownloads: "التنزيلات الأسبوعية",
      weeklyTraffic: "حركة المرور الأسبوعية",
      downloadsAndTraffic: "التنزيلات وحركة المرور"
    },
    helpers: {
      warnings: "تعرف على المزيد حول التحذيرات في",
      spdx: "تعرف على المزيد حول مشروع SPDX",
      here: "هنا",
      openSsf: "تعرف على المزيد حول بطاقات أداء OpenSSF",
      thirdPartyTools: "أدوات الطرف الثالث"
    }
  },
  searchbar_placeholder: "بحث",
  loading_nodes: "... جاري تحميل العقد ...",
  please_wait: "(يرجى الانتظار)",
  popup: {
    maintainer: {
      intree: "حزم في شجرة التبعيات"
    },
    report: {
      title: "إنشاء تقرير",
      form: {
        title: "عنوان التقرير",
        includesAllDeps: "تضمين جميع التبعيات",
        dark_theme: "السمة الداكنة",
        light_theme: "السمة الفاتحة",
        submit: "إنشاء"
      }
    }
  },
  home: {
    overview: {
      title: "نظرة عامة",
      dependencies: "التبعيات",
      totalSize: "الحجم الإجمالي",
      directDeps: "التبعيات المباشرة",
      transitiveDeps: "التبعيات المتعدية",
      downloadsLastWeek: "التنزيلات الأسبوع الماضي",
      generateReport: "إنشاء تقرير"
    },
    watch: "الحزم في شجرة التبعيات التي تتطلب اهتماماً أكبر",
    criticalWarnings: "التحذيرات الحرجة",
    moduleTypes: "أنواع الوحدات",
    maintainers: "المشرفون",
    showMore: "عرض المزيد",
    showLess: "عرض أقل"
  },
  settings: {
    general: {
      title: "عام",
      save: "حفظ",
      defaultPannel: "قائمة الحزمة الافتراضية",
      themePannel: "سمة الواجهة",
      warnings: "تحذيرات SAST للتجاهل",
      flags: "الأعلام (الرموز التعبيرية) للتجاهل",
      network: "الشبكة",
      showFriendly: "عرض التبعيات الودية",
      security: "الأمان",
      disableExternalRequests: "تعطيل الطلبات الخارجية"
    },
    shortcuts: {
      title: "اختصارات لوحة المفاتيح",
      blockquote: "انقر على مفتاح الاختصار للتحديث",
      goto: "انتقال إلى",
      openCloseWiki: "فتح/إغلاق الويكي",
      lock: "قفل/فتح قفل الشبكة"
    }
  },
  network: {
    childOf: "ابن",
    parentOf: "أب",
    unlocked: "غير مقفل",
    locked: "مقفل"
  },
  search: {
    "File extensions": "امتدادات الملفات",
    "Node.js core modules": "وحدات Node.js الأساسية",
    "Available licenses": "التراخيص المتاحة",
    "Available flags": "الأعلام المتاحة",
    default: "خيارات البحث",
    recentPackages: "الحزم الأخيرة",
    packagesCache: "الحزم المتاحة في ذاكرة التخزين المؤقت",
    noPackageFound: "لم يتم العثور على حزمة",
    packageLengthErr: "يجب أن يكون اسم الحزمة بين 2 و 64 حرفاً.",
    registryPlaceholder: "البحث عن الحزم"
  },
  legend: {
    default: "الحزمة بخير.",
    warn: "الحزمة بها تحذيرات.",
    friendly: "الحزمة تتم صيانتها بواسطة نفس مؤلفي الحزمة الجذرية."
  },
  lockedNavigation: {
    next: "التالي",
    prev: "السابق"
  }
};

export default { cli, ui };
