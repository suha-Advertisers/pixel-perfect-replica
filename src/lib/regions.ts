import riyadh from "@/assets/regions/riyadh.jpg";
import makkah from "@/assets/regions/makkah.jpg";
import eastern from "@/assets/regions/eastern.jpg";
import madinah from "@/assets/regions/madinah.jpg";
import qassim from "@/assets/regions/qassim.jpg";
import asir from "@/assets/regions/asir.jpg";
import tabuk from "@/assets/regions/tabuk.jpg";
import hail from "@/assets/regions/hail.jpg";
import jazan from "@/assets/regions/jazan.jpg";
import najran from "@/assets/regions/najran.jpg";
import jouf from "@/assets/regions/jouf.jpg";
import northern from "@/assets/regions/northern.jpg";
import baha from "@/assets/regions/baha.jpg";

/**
 * TEMPORARY starting list for Phase 1 screens only.
 * In Phase 3 regions, cities and districts move to the database and become editable
 * from the admin panel; this file then keeps only the photo for each region slug.
 */
export type Region = {
  slug: string;
  name: string;
  image: string;
  cities: string[];
};

export const regions: Region[] = [
  {
    slug: "riyadh",
    name: "منطقة الرياض",
    image: riyadh,
    cities: [
      "شمال الرياض",
      "جنوب الرياض",
      "شرق الرياض",
      "غرب الرياض",
      "وسط الرياض",
      "الخرج",
      "الدرعية",
      "المجمعة",
      "الدوادمي",
      "الزلفي",
      "وادي الدواسر",
      "عفيف",
    ],
  },
  {
    slug: "makkah",
    name: "منطقة مكة المكرمة",
    image: makkah,
    cities: ["مكة المكرمة", "جدة", "الطائف", "رابغ", "القنفذة", "الليث", "الجموم"],
  },
  {
    slug: "eastern",
    name: "المنطقة الشرقية",
    image: eastern,
    cities: ["الدمام", "الخبر", "الظهران", "الأحساء", "الجبيل", "القطيف", "حفر الباطن", "الخفجي"],
  },
  {
    slug: "madinah",
    name: "منطقة المدينة المنورة",
    image: madinah,
    cities: ["المدينة المنورة", "ينبع", "العلا", "بدر", "خيبر", "المهد"],
  },
  {
    slug: "qassim",
    name: "منطقة القصيم",
    image: qassim,
    cities: ["بريدة", "عنيزة", "الرس", "البكيرية", "المذنب", "البدائع"],
  },
  {
    slug: "asir",
    name: "منطقة عسير",
    image: asir,
    cities: ["أبها", "خميس مشيط", "بيشة", "النماص", "محايل عسير", "سراة عبيدة"],
  },
  {
    slug: "tabuk",
    name: "منطقة تبوك",
    image: tabuk,
    cities: ["تبوك", "الوجه", "ضباء", "تيماء", "أملج", "حقل"],
  },
  { slug: "hail", name: "منطقة حائل", image: hail, cities: ["حائل", "بقعاء", "الغزالة", "الشنان"] },
  {
    slug: "jazan",
    name: "منطقة جازان",
    image: jazan,
    cities: ["جازان", "صبيا", "أبو عريش", "صامطة", "فرسان", "بيش"],
  },
  {
    slug: "najran",
    name: "منطقة نجران",
    image: najran,
    cities: ["نجران", "شرورة", "حبونا", "بدر الجنوب"],
  },
  {
    slug: "jouf",
    name: "منطقة الجوف",
    image: jouf,
    cities: ["سكاكا", "دومة الجندل", "القريات", "طبرجل"],
  },
  {
    slug: "northern-borders",
    name: "منطقة الحدود الشمالية",
    image: northern,
    cities: ["عرعر", "رفحاء", "طريف", "العويقيلة"],
  },
  {
    slug: "baha",
    name: "منطقة الباحة",
    image: baha,
    cities: ["الباحة", "بلجرشي", "المندق", "المخواة", "قلوة"],
  },
];

export function findRegion(slug: string) {
  return regions.find((r) => r.slug === slug);
}
