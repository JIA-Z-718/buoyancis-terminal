import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in environment.");
  console.error(
    "Run this script with those env vars set, e.g.: VITE_SUPABASE_URL=... VITE_SUPABASE_PUBLISHABLE_KEY=... node seed.js",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const restaurants = [
  {
    name: "Frantzén",
    name_cn: "弗兰岑",
    slug: "frantzen-stockholm",
    category: "restaurant",
    city: "Stockholm",
    region: "Stockholm",
    cuisine: "Nordic",
    address: "Klara Norra kyrkogata 26, 111 22 Stockholm, Sweden",
    phone: "+46 8 20 85 80",
    website: "https://www.restaurantfrantzen.com/",
    image_url: null,
    buoyancis_score: 4.9,
    traditional_score: 4.8,
    review_count: 128,
    verified_review_count: 42,
    initial_gravity_mass: 9.7,
    is_featured: true,
  },
  {
    name: "Ekstedt",
    name_cn: "埃克斯特德",
    slug: "ekstedt-stockholm",
    category: "restaurant",
    city: "Stockholm",
    region: "Stockholm",
    cuisine: "Nordic",
    address: "Humlegårdsgatan 17, 114 46 Stockholm, Sweden",
    phone: "+46 8 611 12 10",
    website: "https://www.ekstedt.nu/",
    image_url: null,
    buoyancis_score: 4.6,
    traditional_score: 4.5,
    review_count: 96,
    verified_review_count: 31,
    initial_gravity_mass: 8.9,
    is_featured: true,
  },
  {
    name: "AIRA",
    name_cn: "AIRA",
    slug: "aira-stockholm",
    category: "restaurant",
    city: "Stockholm",
    region: "Stockholm",
    cuisine: "Nordic",
    address: "Biskopsvägen 9, 115 21 Stockholm, Sweden",
    phone: "+46 8 20 85 80",
    website: "https://www.airarestaurant.com/",
    image_url: null,
    buoyancis_score: 4.7,
    traditional_score: 4.6,
    review_count: 87,
    verified_review_count: 27,
    initial_gravity_mass: 9.2,
    is_featured: true,
  },
  {
    name: "Operakällaren",
    name_cn: "歌剧院餐厅",
    slug: "operakallaren-stockholm",
    category: "restaurant",
    city: "Stockholm",
    region: "Stockholm",
    cuisine: "Swedish",
    address: "Karl XII:s torg, 111 47 Stockholm, Sweden",
    phone: "+46 8 676 58 00",
    website: "https://operakallaren.se/",
    image_url: null,
    buoyancis_score: 4.5,
    traditional_score: 4.4,
    review_count: 112,
    verified_review_count: 35,
    initial_gravity_mass: 8.7,
    is_featured: true,
  },
];

async function run() {
  console.log("Seeding restaurants…");

  const slugs = restaurants.map((r) => r.slug);

  // Clean out any existing rows for these slugs to keep the seed idempotent
  const { error: deleteError } = await supabase
    .from("restaurants")
    .delete()
    .in("slug", slugs);

  if (deleteError) {
    console.error("Failed to delete existing restaurants:", deleteError.message);
    process.exit(1);
  }

  const { error: insertError } = await supabase.from("restaurants").insert(
    restaurants.map((r) => ({
      ...r,
      // Ensure required fields that might have defaults in DB
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })),
  );

  if (insertError) {
    console.error("Failed to insert restaurants:", insertError.message);
    process.exit(1);
  }

  console.log("✅ Seed completed. Inserted restaurants:");
  for (const r of restaurants) {
    console.log(`- ${r.name} (${r.slug})`);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

