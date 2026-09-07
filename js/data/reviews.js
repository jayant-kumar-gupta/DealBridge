export const reviews = [
  { id: 1, productId: 1, userId: 1, author: 'Jayant Kumar', rating: 5, title: 'Best headphones I\'ve ever owned', text: 'The noise cancellation is phenomenal. It blocks out almost everything in the office. Very comfortable for long sessions.', date: '2026-07-15', verified: true, helpful: 24 },
  { id: 2, productId: 1, userId: null, author: 'Sneha R.', rating: 4, title: 'Great sound, slightly expensive', text: 'Audio quality is top-notch. Battery life easily lasts me a week of commuting. Only docking a star for the high price.', date: '2026-07-20', verified: true, helpful: 12 },
  { id: 3, productId: 1, userId: null, author: 'Amit P.', rating: 5, title: 'Perfect for travel', text: 'Used these on a 14 hour flight and they were a lifesaver. The case is a bit bulky though.', date: '2026-08-02', verified: true, helpful: 5 },
  
  { id: 4, productId: 3, userId: null, author: 'Vikram S.', rating: 4, title: 'Beautiful picture quality', text: 'The 4K resolution is crisp. UI can be a bit sluggish sometimes, but for the price, it\'s an amazing TV.', date: '2026-06-10', verified: true, helpful: 45 },
  { id: 5, productId: 3, userId: null, author: 'Priya M.', rating: 5, title: 'Value for money', text: 'Got this during the sale. The colors pop and the bezel-less design looks very premium in my living room.', date: '2026-07-05', verified: true, helpful: 18 },
  
  { id: 6, productId: 4, userId: null, author: 'Rahul D.', rating: 5, title: 'The perfect laptop', text: 'Upgraded from an intel mac. The M3 chip is incredibly fast and battery life is unreal. Easily gets through a full workday.', date: '2026-08-10', verified: true, helpful: 89 },
  { id: 7, productId: 4, userId: null, author: 'Kavita K.', rating: 4, title: 'Light and fast', text: 'Very portable and powerful enough for my design work. Wish it had more ports out of the box.', date: '2026-08-12', verified: true, helpful: 14 },
  
  { id: 8, productId: 7, userId: 1, author: 'Jayant Kumar', rating: 5, title: 'Amazing camera', text: 'The titanium build makes it noticeably lighter. The 48MP camera takes stunning photos even in low light.', date: '2026-05-20', verified: true, helpful: 56 },
  { id: 9, productId: 7, userId: null, author: 'Anil B.', rating: 5, title: 'Smooth experience', text: 'Performance is buttery smooth. The action button is surprisingly useful once you set it up.', date: '2026-06-15', verified: true, helpful: 22 },
  
  { id: 10, productId: 8, userId: null, author: 'Deepak T.', rating: 4, title: 'The ultimate android', text: 'Display is gorgeous. The AI features are cool but some feel like gimmicks. S-Pen is handy for notes.', date: '2026-07-01', verified: true, helpful: 34 },
  
  { id: 11, productId: 10, userId: null, author: 'Karan J.', rating: 5, title: 'So comfortable', text: 'These look great and feel even better. The air bubble at the back provides so much cushion for walking.', date: '2026-04-12', verified: true, helpful: 19 },
  { id: 12, productId: 10, userId: null, author: 'Neha W.', rating: 4, title: 'Run half size small', text: 'Love the design but I had to exchange for a half size up. Order slightly larger than your normal size.', date: '2026-05-08', verified: true, helpful: 41 },
  
  { id: 13, productId: 13, userId: null, author: 'Suresh V.', rating: 5, title: 'Makes cleaning fun', text: 'The laser attachment shows dust you didn\'t even know was there. Very satisfying to use and empties easily.', date: '2026-07-22', verified: true, helpful: 67 },
  
  { id: 14, productId: 16, userId: null, author: 'Aditya N.', rating: 5, title: 'Next gen is here', text: 'Load times are practically non-existent. The DualSense controller haptics are game-changing.', date: '2026-01-15', verified: true, helpful: 112 },
  { id: 15, productId: 16, userId: null, author: 'Meera P.', rating: 4, title: 'Great games, huge console', text: 'The exclusives look amazing, but the console itself is massive. Had to rearrange my TV stand to fit it.', date: '2026-03-10', verified: true, helpful: 28 },
  
  { id: 16, productId: 19, userId: 1, author: 'Jayant Kumar', rating: 5, title: 'Best ANC earbuds', text: 'Huge upgrade over gen 1. The noise cancellation is twice as good and the case speaker is very handy for finding them.', date: '2026-06-05', verified: true, helpful: 45 },
  { id: 17, productId: 19, userId: null, author: 'Rohan C.', rating: 4, title: 'Seamless ecosystem', text: 'Connects instantly to my iPhone and Mac. Sound is well balanced. Spatial audio is a neat trick for movies.', date: '2026-07-18', verified: true, helpful: 16 },
  
  { id: 18, productId: 22, userId: null, author: 'Pooja S.', rating: 5, title: 'Worth the hype', text: 'I was skeptical of the price, but it completely replaced all my other hair tools. Doesn\'t damage my hair.', date: '2026-05-30', verified: true, helpful: 89 },
  { id: 19, productId: 22, userId: null, author: 'Anjali R.', rating: 4, title: 'Takes practice', text: 'Amazing results once you figure out the technique. There is a learning curve to using the Coanda effect.', date: '2026-06-25', verified: true, helpful: 32 },
  
  { id: 20, productId: 24, userId: null, author: 'Swati G.', rating: 5, title: 'Simple and effective', text: 'Cleared up my skin in weeks. No fragrance or unnecessary fillers. Unbeatable price for this quality.', date: '2026-08-01', verified: true, helpful: 54 },
  
  { id: 21, productId: 2, userId: null, author: 'Gaurav K.', rating: 5, title: 'Loud and clear', text: 'Took this to a pool party and it survived getting splashed all day. Bass is surprisingly punchy for its size.', date: '2026-07-10', verified: true, helpful: 11 },
  { id: 22, productId: 5, userId: null, author: 'Manoj L.', rating: 5, title: 'Beast of a machine', text: 'Runs every AAA game I throw at it on ultra settings over 100fps. Cooling is loud but effective.', date: '2026-08-05', verified: true, helpful: 23 },
  { id: 23, productId: 6, userId: null, author: 'Tina M.', rating: 4, title: 'Good basic laptop', text: 'Bought for college. Handles multiple tabs and word docs fine. Build quality feels a bit plasticky.', date: '2026-07-28', verified: true, helpful: 8 },
  { id: 24, productId: 9, userId: null, author: 'Varun H.', rating: 5, title: 'Charges so fast', text: '0 to 100 in about 30 mins is insane. OxygenOS is clean and the cameras have improved significantly.', date: '2026-06-18', verified: true, helpful: 37 },
  { id: 25, productId: 11, userId: null, author: 'Kabir D.', rating: 5, title: 'A classic', text: 'Can\'t go wrong with 501s. The fit is perfect, denim is thick and durable. Will buy more colors.', date: '2026-05-14', verified: true, helpful: 15 },
  { id: 26, productId: 12, userId: null, author: 'Simran B.', rating: 5, title: 'Timeless style', text: 'Love the green lenses. They look good with literally any outfit. Arrived in perfect condition.', date: '2026-07-02', verified: true, helpful: 21 },
  { id: 27, productId: 14, userId: null, author: 'Arjun T.', rating: 4, title: 'Silent and efficient', text: 'Washes well and uses very little water. The spin cycle is surprisingly quiet compared to my old washer.', date: '2026-04-20', verified: true, helpful: 29 },
  { id: 28, productId: 15, userId: null, author: 'Rekha K.', rating: 5, title: 'Cooks everything perfectly', text: 'Fries, chicken, veggies - everything comes out crispy without oil. Easy to clean the basket.', date: '2026-06-11', verified: true, helpful: 42 },
  { id: 29, productId: 17, userId: null, author: 'Nikhil R.', rating: 5, title: 'Game Pass machine', text: 'Paired with Game Pass, this is the best value in gaming. Quick resume feature is literal magic.', date: '2026-03-05', verified: true, helpful: 51 },
  { id: 30, productId: 18, userId: null, author: 'Isha S.', rating: 5, title: 'Screen makes a difference', text: 'Upgraded from the original switch. The OLED screen colors are so vibrant it feels like a new system.', date: '2026-07-30', verified: true, helpful: 66 },
  { id: 31, productId: 20, userId: null, author: 'Sanjay P.', rating: 4, title: 'Good tracking', text: 'Sleep tracking is very detailed. Battery only lasts about a day and a half with AOD on.', date: '2026-08-08', verified: true, helpful: 14 },
  { id: 32, productId: 21, userId: null, author: 'Deepali J.', rating: 5, title: 'One charger for everything', text: 'Charges my macbook, phone, and watch all at once. Very compact for travel.', date: '2026-07-12', verified: true, helpful: 33 },
  { id: 33, productId: 23, userId: null, author: 'Pallavi V.', rating: 4, title: 'Cute but tiny', text: 'Great shades, classic MAC formula. Be warned they are very small, but good for keeping in a small purse.', date: '2026-06-22', verified: true, helpful: 27 }
];

export function getReviewsByProduct(productId) {
  return reviews.filter(r => r.productId === productId).sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getAverageRating(productId) {
  const prodReviews = getReviewsByProduct(productId);
  if (prodReviews.length === 0) return 0;
  const sum = prodReviews.reduce((acc, r) => acc + r.rating, 0);
  return (sum / prodReviews.length).toFixed(1);
}

export function getRatingDistribution(productId) {
  const prodReviews = getReviewsByProduct(productId);
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  prodReviews.forEach(r => {
    dist[r.rating]++;
  });
  return dist;
}
