/*
 * SITE CONFIG — edit this file to add your affiliate details.
 *
 * Books: set `amazonTag` to your Amazon Associates tracking ID (e.g. "mytag-20").
 *   Every book link becomes an Amazon link carrying your tag.
 *   To use a different store (or a direct product link), set `affiliateUrl` on that book in js/data/media.js.
 *
 * Courses: each course in js/data/media.js has an `affiliateUrl` field.
 *   Paste the affiliate link you get from Udemy / Coursera / Educative / etc. there.
 *   Until you do, the course's normal public URL is used.
 */
window.SITE_CONFIG = {
  siteName: 'Scale Kingdom',
  amazonTag: '',            // e.g. 'yourtag-20'
  amazonDomain: 'www.amazon.com',
  showAffiliateDisclosure: true,
  affiliateDisclosure: 'Some links on this page are affiliate links. If you buy through them, this site may earn a small commission at no extra cost to you.'
};
