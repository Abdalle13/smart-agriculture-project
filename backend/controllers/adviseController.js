// ─── Backend Agronomic Advisory Engine
// Handles real-time localized Somali recommendations with styled status alerts.

// ─── Weather Advisory Controller
// POST /api/advise/weather
export const getWeatherAdvisory = async (req, res) => {
  try {
    const { current, forecast } = req.body

    if (!current) {
      return res.status(400).json({ success: false, message: 'Weather data is required.' })
    }

    const tips = []
    const temp     = current.temp     || 24
    const humidity = current.humidity || 75
    const wind     = current.windSpeed || 0

    const daysList = forecast || []
    const maxRainDay = daysList.reduce((max, f) => ((f.rain || 0) > (max.rain || 0) ? f : max), { rain: 0 })
    const maxRain    = maxRainDay.rain || 0
    const rainyDays  = daysList.filter(f => (f.rain || 0) >= 40)

    const SOMALI_DAYS = {
      'sun': 'Axdiga',
      'mon': 'Isniinta',
      'tue': 'Talaadada',
      'wed': 'Arbacada',
      'thu': 'Khamiista',
      'fri': 'Jimcaha',
      'sat': 'Sabtida',
      'today': 'Maanta',
      'tomorrow': 'Berri',
    }
    const formatSomaliDay = (dayStr) => {
      if (!dayStr) return 'Maalinta Soo Socda'
      const key = dayStr.toString().trim().toLowerCase()
      return SOMALI_DAYS[key] || dayStr
    }

    const maxRainDayName = formatSomaliDay(maxRainDay.day)

    // 1. Thermal Stress
    if (temp >= 35) {
      tips.push({
        type: 'danger',
        title: 'KULAYLKU WAA XADDIGA',
        message: `Heerkulku hadda waa ${temp}°C, taasi waa kulaylkii ugu sarreeya ee dhirtaada waxyeello u geysan kara. Waraabinta beerta samay subaxda hore si aad dhirta uga badbaadiso engegga.`,
      })
    } else if (temp >= 30) {
      tips.push({
        type: 'warning',
        title: 'KULAYLKU WAA SAREEYE',
        message: `Heerkulku waa ${temp}°C. Hawadda waa kulul, sidaas awgeed waraabinta beerta ha ka dhicin saacadaha dhexe ee maalinta. Subaxda hore ama galabnimada dheer ayaa ugu haboon.`,
      })
    }

    // 2. Rainfall forecast
    if (maxRain >= 70) {
      tips.push({
        type: 'info',
        title: `ROOB XOOG AH OO LA FILAYO — ${maxRainDayName.toUpperCase()}`,
        message: `Waxaa saadaalinta cimiladu tilmaamaysaa in roob xooggan oo ${maxRain}% awood leh uu da'i doono maalinta ${maxRainDayName}. Waraabinta jooji maanta, oo makiinnada biyaha nadiifi si uusan roobku biyo daadgureyn u dhalistayn.`,
      })
    } else if (maxRain >= 40) {
      tips.push({
        type: 'info',
        title: `ROOB FUDUD OO LA FILAYO — ${maxRainDayName.toUpperCase()}`,
        message: `Saadaalinta cimiladu waxay tilmaamaysaa in roob fudud uu da'i karo maalinta ${maxRainDayName}. Waraabinta yar gareey maalmahan si looga taxaddaro biyo kororsi aan loo baahnayn.`,
      })
    } else {
      // Calculate average low rain across all days
      const avgRain = daysList.length
        ? Math.round(daysList.reduce((s, f) => s + (f.rain || 0), 0) / daysList.length)
        : 0
      tips.push({
        type: 'info',
        title: 'SAADAALINTA 5-TA MAALMOOD EE SOO SOCTA',
        message: `Saadaalinta ${daysList.length || 5}-ta maalmood ee soo socda, roob weyn oo muuqda kuma jiro saadaalinta cimilada. Celceliska fursadda roobku maalmahan waa ${avgRain}%. Waraabinta beerta sii wad si caadi ah, ayna kaga fadhin qoyaanka dabiiciga ah.`,
      })
    }

    // 3. Wind warning
    if (wind >= 45) {
      tips.push({
        type: 'danger',
        title: 'DABAYL ADAG OO KHATAR AH',
        message: `Dabaysha xawaaraheedu hadda waa ${wind} km/h, taasi waa dabayl adag. Ha buufin wax sunta nolosha ama bacriminta maalinta maanta, waxayna dhicitaanka geedaha yar keeni kartaa. Xoog ku xidh waxyaalaha beerta ee furan.`,
      })
    } else if (wind >= 30) {
      tips.push({
        type: 'warning',
        title: 'DABAYL XOOGGAN',
        message: `Xawaaraha dabayshu hadda waa ${wind} km/h. Maalintaan ha buufin sunta caleenta ama bacriminta maadaama dabaysha ay ku kala qaadi karto oo ay waxtarka yareyneysaa.`,
      })
    }

    // 4. Humidity fungal risk
    if (humidity > 85) {
      tips.push({
        type: 'warning',
        title: 'HAWADU WAA QOYAAN BADAN',
        message: `Qoyaanka hawadu hadda waa ${humidity}%. Xaaladdan waxay sahlaysaa in cudurrada  (fungal diseases) ay ku baahaan caleenta dhirta. Ku fiirso dhirta oo hubi in caleemuhu u daallacan yihiin.`,
      })
    }

    res.json({ success: true, advisory: tips })
  } catch (err) {
    console.error('Weather advisory error:', err.message)
    res.status(500).json({ success: false, message: 'Could not compute weather advisory.' })
  }
}

// ─── Soil Advisory Controller
// POST /api/advise/soil
export const getSoilAdvisory = async (req, res) => {
  try {
    const { nitrogen = 0, phosphorus = 0, potassium = 0, temperature = 0, humidity = 0, moisture = 0 } = req.body

    const tips = []

    // 1. Soil Moisture
    if (moisture > 85) {
      tips.push({
        type: 'warning',
        title: 'CIIDDU BIYO BADAN BAY LEEDAHAY',
        message: `Qoyaanka ciiddu hadda waa ${moisture}%, taasi waa xad ka sarreeya waxa loo baahan yahay. Biyo xad-dhaafku waxay xididdada dhirta u dili karaan. Nidaamka biyaha beerta fiiri oo hubi in biyuhu si fiican u baxayaan.`,
      })
    } else if (moisture < 35) {
      tips.push({
        type: 'danger',
        title: 'CIIDDU AAD AYEY U ENGEGAN TAHAY',
        message: `Qoyaanka ciiddu hadda waa ${moisture}%, kaas oo aad u hooseeya. Dhirtu waxay u baahan tahay biyo si degdeg ah. Beerta waraabi maanta lafigeed si looga hortago in dhirtu engegto.`,
      })
    }

    // 2. NPK Chemistry
    if (nitrogen < 50) {
      tips.push({
        type: 'warning',
        title: 'BACRIMINTA NITROGEN (N) WAA YARAADAY',
        message: `Nafaqada Nitrogen-ka ciiddu waa ${nitrogen} mg/kg, kaas oo ka hooseeya xaddiga loo baahan yahay. Nitrogen-ku waa waxa dhirtu caleemaha ku yeeshaa oo kordhiya midabka cagaaran. Tag suuqa beeraha oo weydii bacriin "nitrogen" ah oo beerta ku dar si dhirtu u koraan si dhakhso leh.`,
      })
    } else if (nitrogen > 200) {
      tips.push({
        type: 'warning',
        title: 'NITROGEN (N) AAD AYUU U BADAN YAHAY',
        message: `Nitrogen-ka ciiddu waa ${nitrogen} mg/kg, kaas oo ka badan xaddiga caafimaadka. Nitrogen badan wuxuu caleemaha guban u keeni karaa oo dhirta dhibi karaa. Jooji bacriminta dheeriga ah ee aad maanta isticmaalayso illaa tiradaas hoos u dhacdo.`,
      })
    }

    if (phosphorus < 25) {
      tips.push({
        type: 'warning',
        title: 'BACRIMINTA PHOSPHORUS (P) WAA YARAADAY',
        message: `Phosphorus-ka ciiddu waa ${phosphorus} mg/kg, kaas oo aad u yar. Phosphorus-ku waa waxa xididdada dhirta ku xoojiya oo kordhinaya tirada midhaha. Tag suuqa beeraha oo weydii bacriin "phosphorus" ama "fosfoor" ah oo ku dar si xididdadu u xoogoobi.`,
      })
    }

    if (potassium < 20) {
      tips.push({
        type: 'warning',
        title: 'BACRIMINTA POTASSIUM (K) WAA YARAADAY',
        message: `Potassium-ka ciiddu waa ${potassium} mg/kg, taas oo hooseysa. Potassium-ku waa waxa dhirtu adkaanshaha cimilada ku yeeshaa kana difaacaya cudurrada. Tag suuqa beeraha oo weydii bacriin "potassium" ama "botas" ah oo beerta ku dar.`,
      })
    }

    // 3. Thermal Stress
    if (temperature > 40) {
      tips.push({
        type: 'danger',
        title: 'KULAYLKA CIIDDA WAA SAREEYE',
        message: `Heerkulka ciiddu waa ${temperature}°C, taas oo xididdada dhirta dhuunta u keeni karta. Ku dabool ciidda caws qalalan ama saalayn (mulch) si heerkulka ciiddu hoos ugu dhaco.`,
      })
    }

    // Default if all optimal
    if (tips.length === 0) {
      tips.push({
        type: 'success',
        title: 'CIIDDU WAA XAL WANAAGSAN',
        message: `Dhammaan tirada nafaqada ciiddu — Nitrogen (${nitrogen} mg/kg), Phosphorus (${phosphorus} mg/kg), iyo Potassium (${potassium} mg/kg) — waxay ku jiraan heerka ugu fiican. Qoyaanku (${moisture}%) wuu habboon yahay. Daryeelka beerta si caadi ah u sii wad.`,
      })
    }

    res.json({ success: true, advisory: tips })
  } catch (err) {
    console.error('Soil advisory error:', err.message)
    res.status(500).json({ success: false, message: 'Could not compute soil advisory.' })
  }
}
