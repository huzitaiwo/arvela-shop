import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  doc,
  writeBatch,
  Timestamp,
} from "./vendor.js";

const WEEK = 7 * 24 * 60 * 60 * 1000;

const articles = [
  {
    slug: "the-art-of-decluttering",
    title: "The Art of Decluttering: Finding Calm in a Clean Space",
    excerpt:
      "Learn simple techniques to declutter your home and create a calmer, more spacious, and stress-free atmosphere.",
    category: "home-organization",
    image: "assets/images/journal-declutter.jpg",
    readTime: 5,
    body: [
      {
        type: "p",
        text: "A calm home rarely comes from owning less for the sake of it. It comes from owning what you use and love, and giving each thing a place to live. Decluttering is simply the practice of making that choice, one object at a time.",
      },
      { type: "h2", text: "Start small, start visible" },
      {
        type: "p",
        text: "Pick a single surface, such as a coffee table, a bedside shelf or the top of a desk. Clear it completely, wipe it down, and return only the items you use weekly. The contrast between the cleared surface and the rest of the room is often the motivation you need to keep going.",
      },
      { type: "h2", text: "Give everything a home" },
      {
        type: "p",
        text: "Clutter is usually just stuff without an address. Open shelving, lidded baskets and slim storage benches turn loose items into something deliberate. Choose storage in the same tones as your walls and floors so it recedes instead of competing for attention.",
      },
      { type: "h2", text: "Keep a one-in, one-out rule" },
      {
        type: "p",
        text: "Once a space feels right, protect it. When something new comes in, something similar leaves. Over a year this single habit does more than any weekend clear-out, because the room never has the chance to fill up again.",
      },
    ],
  },
  {
    slug: "designing-your-modern-cozy-nook",
    title: "Designing Your Modern Cozy Nook",
    excerpt:
      "Explore how Scandinavian design principles can transform a small corner into a warm, comfortable, and stylish retreat.",
    category: "small-spaces",
    image: "assets/images/journal-cozy-nook.jpg",
    readTime: 4,
    body: [
      {
        type: "p",
        text: "Every home has an unused corner: the gap beside a window, the end of a hallway, the space behind a door. With a little planning, it can become the spot you retreat to most. Scandinavian design is built on exactly this idea, that warmth comes from comfort and light rather than from quantity.",
      },
      { type: "h2", text: "Anchor it with one good seat" },
      {
        type: "p",
        text: "Start with a single chair you genuinely want to sit in. Choose a rounded silhouette and a soft, neutral fabric, and place it close enough to the wall to feel sheltered rather than exposed.",
      },
      { type: "h2", text: "Layer light and texture" },
      {
        type: "p",
        text: "Add a small lamp with a warm bulb, positioned at about eye level when you are seated, then bring in two textures. A knitted throw and a woven basket work well. Keep the palette to two or three quiet tones so the nook feels restful.",
      },
      { type: "h2", text: "Edit until it breathes" },
      {
        type: "p",
        text: "A nook needs only a seat, a light and a surface for a cup or a book. Leave the remaining wall space empty. The negative space is part of the design.",
      },
    ],
  },
  {
    slug: "investing-in-timeless-furniture",
    title: "Investing in Timeless Furniture Pieces",
    excerpt:
      "Discover why choosing furniture with enduring design can save you money and create a home that remains beautiful for years.",
    category: "furniture-guide",
    image: "assets/images/journal-timeless-pieces.jpg",
    readTime: 6,
    body: [
      {
        type: "p",
        text: "Trends move quickly, but a well-made chair or table can serve a household for decades. Choosing pieces with an enduring design is one of the few decorating decisions that saves money over time.",
      },
      { type: "h2", text: "Look at the construction first" },
      {
        type: "p",
        text: "Solid joints, sturdy frames and real wood legs matter more than surface finishes. Sit on the chair, lean on the table, open the drawer. If it feels solid in the showroom, it will feel solid in five years.",
      },
      { type: "h2", text: "Choose calm shapes and neutral materials" },
      {
        type: "p",
        text: "Simple lines, soft curves and natural tones sit comfortably with almost any style, which means they survive every redecoration. Bring personality through accessories you can swap, not through the largest pieces.",
      },
      { type: "h2", text: "Think in cost per year" },
      {
        type: "p",
        text: "A piece that costs twice as much but lasts four times as long is the cheaper one. Buy fewer, better things, and look after them. A little care keeps good furniture looking good.",
      },
    ],
  },
];

const form = document.getElementById("seed-form");
const status = document.getElementById("seed-status");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  status.textContent = "Working…";
  try {
    await signInWithEmailAndPassword(
      auth,
      form.email.value,
      form.password.value,
    );

    const batch = writeBatch(db);
    articles.forEach((article, i) => {
      batch.set(doc(db, "articles", article.slug), {
        ...article,
        author: "Handsome",
        publishedAt: Timestamp.fromMillis(Date.now() - i * WEEK), // first item is newest
      });
    });
    await batch.commit();

    status.textContent = `Done: ${articles.length} articles saved. Delete seed.html and the seed scripts now.`;
  } catch (error) {
    status.textContent = `Failed: ${error.code || error.message}`;
  }
});
