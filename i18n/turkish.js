/* eslint-disable @stylistic/max-len */

// Import Third-party Dependencies
import { taggedString as tS } from "@nodesecure/i18n";

const cli = {
  executing_at: "node-secure çalıştırılıyor",
  min_nodejs_version: tS`node-secure çalışması için en az Node.js ${0} gereklidir! Lütfen Node.js sürümünüzü yükseltin.`,
  no_dep_to_proceed: "İşlenecek bağımlılık yok!",
  successfully_written_json: tS`Sonuç dosyası başarıyla yazıldı: ${0}`,
  http_server_started: "HTTP Sunucusu başlatıldı:",
  missingEnv: tS`${0} ortam değişkeni eksik!`,
  stat: tS`${0} ${1} içinde ${2}`,
  commands: {
    option_depth: "Getirilecek maksimum bağımlılık derinliği",
    option_output: "JSON dosyası çıktı adı",
    option_silent: "CLI döndürücülerini devre dışı bırakan sessiz modu etkinleştir",
    option_contacts: "Vurgulanacak kişilerin listesi",
    option_verbose: "CLI'nin log seviyesini verbose olarak ayarlar, bu da CLI'nin daha ayrıntılı loglar üretmesine neden olur.",
    strategy: "Kullanılacak güvenlik açığı kaynağı",
    cwd: {
      desc: "Geçerli çalışma dizininde güvenlik analizi çalıştır",
      option_nolock: "package-lock.json kullanımını devre dışı bırak",
      option_full: "package-lock.json dosyasındaki paketlerin tam analizini etkinleştir"
    },
    from: {
      desc: "npm kayıt defterinden belirli bir paket üzerinde güvenlik analizi çalıştır",
      searching: tS`npm kayıt defterinde '${0}' bildirimi aranıyor...`,
      fetched: tS`${0} bildirimi npm'den ${1} sürede alındı`
    },
    auto: {
      desc: "Geçerli çalışma dizini veya belirli bir paket üzerinde güvenlik analizi çalıştır ve web arayüzünü otomatik olarak aç",
      option_keep: "Çalıştırmadan sonra nsecure-result.json dosyasını sistemde tut"
    },
    open: {
      desc: "Belirli bir nsecure JSON dosyasıyla HTTP Sunucusu çalıştır",
      option_port: "Çalışma portunu tanımla",
      option_fresh_start: "Mevcut yük dosyasını yok sayarak sunucuyu sıfırdan başlat",
      option_developer: "Otomatik HTML bileşen yenilemesini etkinleştirerek sunucuyu geliştirici modunda başlat"
    },
    verify: {
      desc: "Belirli bir npm paketi için kapsamlı gelişmiş analiz çalıştır",
      option_json: "Analiz yükünü stdout'a yaz"
    },
    summary: {
      desc: "Analiz sonuçlarınızı görüntüleyin",
      warnings: "Uyarılar"
    },
    lang: {
      desc: "CLI varsayılan dilini yapılandır",
      question_text: "Hangi dili kullanmak istiyorsunuz?",
      new_selection: tS`'${0}' yeni CLI dili olarak seçildi!`
    },
    scorecard: {
      desc: "Belirli bir depo veya geçerli çalışma dizini için OSSF Puan Kartını görüntüle (Yalnızca GitHub, örn. fastify/fastify)",
      option_vcs: "Sürüm kontrol platformu (GitHub, GitLab)"
    },
    report: {
      desc: "Bir paketten rapor oluştur",
      option_includesAllDeps: "Tüm bağımlılıkları dahil et",
      option_theme: "Rapor teması ('dark', 'light')",
      option_title: "Rapor başlığı",
      option_reporters: "Kullanılacak raporlayıcıların listesi: 'html', 'pdf'"
    },
    config: {
      desc: "NodeSecure yapılandırma dosyanızı düzenleyin"
    },
    configCreate: {
      desc: "NodeSecure yapılandırma dosyanızı başlatın",
      option_cwd: "Yapılandırma dosyasını geçerli çalışma dizininde oluştur"
    },
    cache: {
      desc: "NodeSecure önbelleğini yönet",
      missingAction: "Geçerli bir işlem belirtilmedi. Seçenekleri görmek için --help kullanın.",
      option_list: "Önbellek dosyalarını listele",
      option_clear: "Önbelleği temizle",
      option_full: "Yükler dahil tam önbelleği temizle veya listele",
      cacheTitle: "NodeSecure Önbelleği:",
      scannedPayloadsTitle: "Diskte mevcut taranan yükler:",
      cleared: "Önbellek başarıyla temizlendi!"
    },
    extractIntegrity: {
      desc: "Bir paketin bildiriminden ve tarball'ından bütünlüğünü çıkar ve farklıysa iki bütünlüğü karşılaştır.",
      missingSpecVersion: tS`'${0}' paketi için bir sürüm belirtmelisiniz.`,
      invalidSpec: tS`'${0}' paket özelliği geçersiz.`,
      specNotFound: tS`'${0}' paket özelliği npm kayıt defterinde bulunamadı.`
    }
  },
  startHttp: {
    invalidScannerVersion: tS`yük '${0}' sürümüyle tarandı ve gerekli CLI aralığı '${1}' karşılamıyor`,
    regenerate: "lütfen CLI kullanarak yeni bir JSON yükü oluşturun"
  }
};

const ui = {
  stats: {
    title: "Genel İstatistikler",
    total_packages: "Toplam paket sayısı",
    total_size: "Toplam boyut",
    indirect_deps: "Dolaylı bağımlılıkları olan paketler",
    extensions: "Uzantılar",
    licenses: "Lisanslar",
    maintainers: "Bakımcılar"
  },
  package_info: {
    navigation: {
      overview: "genel bakış",
      files: "dosyalar",
      dependencies: "betikler ve bağımlılıklar",
      warnings: "kaynak kodundaki tehditler",
      vulnerabilities: "güvenlik açıkları (CVE)",
      licenses: "lisans uyumluluğu (SPDX)",
      dark: "koyu",
      light: "açık"
    },
    title: {
      maintainers: "bakımcılar",
      releases: "sürümler",
      files: "dosyalar",
      files_extensions: "dosya uzantıları",
      unused_deps: "kullanılmayan bağımlılıklar",
      missing_deps: "eksik bağımlılıklar",
      minified_files: "küçültülmüş dosyalar",
      node_deps: "node.js bağımlılıkları",
      third_party_deps: "üçüncü taraf bağımlılıklar",
      required_files: "gerekli dosyalar",
      used_by: "kullanan",
      openSsfScorecard: "Güvenlik Puan Kartı"
    },
    overview: {
      homepage: "Ana Sayfa",
      author: "Yazar",
      size: "Sistemdeki boyut",
      dependencies: "Bağımlılık sayısı",
      files: "Dosya sayısı",
      tsTypings: "TS Tipleri",
      node: "Node.js Uyumluluğu",
      npm: "NPM Uyumluluğu",
      type: "Modül tipi",
      lastReleaseVersion: "Son sürüm versiyonu",
      lastReleaseDate: "Son sürüm tarihi",
      publishedReleases: "Yayınlanan sürüm sayısı",
      numberPublishers: "Yayıncı sayısı",
      weeklyDownloads: "Haftalık indirmeler",
      weeklyTraffic: "Haftalık trafik",
      downloadsAndTraffic: "İndirmeler ve trafik"
    },
    helpers: {
      warnings: "Uyarılar hakkında daha fazla bilgi edinin",
      spdx: "SPDX projesi hakkında daha fazla bilgi edinin",
      here: "burada",
      openSsf: "OpenSSF Puan Kartları hakkında daha fazla bilgi edinin",
      thirdPartyTools: "Üçüncü taraf araçlar"
    }
  },
  searchbar_placeholder: "Ara",
  loading_nodes: "... Düğümler yükleniyor ...",
  please_wait: "(Lütfen bekleyin)",
  popup: {
    maintainer: {
      intree: "bağımlılık ağacındaki paketler"
    },
    report: {
      title: "Rapor oluştur",
      form: {
        title: "Rapor başlığı",
        includesAllDeps: "Tüm bağımlılıkları dahil et",
        dark_theme: "Koyu tema",
        light_theme: "Açık tema",
        submit: "Oluştur"
      }
    }
  },
  home: {
    overview: {
      title: "Genel Bakış",
      dependencies: "bağımlılıklar",
      totalSize: "toplam boyut",
      directDeps: "doğrudan bağımlılıklar",
      transitiveDeps: "geçişli bağımlılıklar",
      downloadsLastWeek: "geçen hafta indirmeler",
      generateReport: "Rapor oluştur"
    },
    watch: "Bağımlılık ağacında daha fazla dikkat gerektiren paketler",
    criticalWarnings: "Kritik Uyarılar",
    moduleTypes: "Modül Tipleri",
    maintainers: "Bakımcılar",
    showMore: "daha fazla göster",
    showLess: "daha az göster"
  },
  settings: {
    general: {
      title: "Genel",
      save: "kaydet",
      defaultPannel: "Varsayılan Paket Menüsü",
      themePannel: "Arayüz teması",
      warnings: "Yok sayılacak SAST Uyarıları",
      flags: "Yok sayılacak Bayraklar (emojiler)",
      network: "Ağ",
      showFriendly: "Dost bağımlılıkları göster",
      security: "Güvenlik",
      disableExternalRequests: "Harici istekleri devre dışı bırak"
    },
    shortcuts: {
      title: "Kısayollar",
      blockquote: "Güncellemek için kısayol tuşuna tıklayın",
      goto: "Git",
      openCloseWiki: "Wiki'yi aç/kapat",
      lock: "Ağı kilitle/kilidini aç"
    }
  },
  network: {
    childOf: "alt öğesi",
    parentOf: "üst öğesi",
    unlocked: "kilitsiz",
    locked: "kilitli"
  },
  search: {
    "File extensions": "Dosya uzantıları",
    "Node.js core modules": "Node.js çekirdek modülleri",
    "Available licenses": "Mevcut lisanslar",
    "Available flags": "Mevcut bayraklar",
    default: "Arama seçenekleri",
    recentPackages: "Son paketler",
    packagesCache: "Önbellekte mevcut paketler",
    noPackageFound: "Paket bulunamadı",
    packageLengthErr: "Paket adı 2 ile 64 karakter arasında olmalıdır.",
    registryPlaceholder: "Paket ara"
  },
  legend: {
    default: "Paket sorunsuz.",
    warn: "Pakette uyarılar var.",
    friendly: "Paket, kök paketin yazarlarıyla aynı kişiler tarafından bakılmaktadır."
  },
  lockedNavigation: {
    next: "Sonraki",
    prev: "Önceki"
  }
};

export default { cli, ui };
