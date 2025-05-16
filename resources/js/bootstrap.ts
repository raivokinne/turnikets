import axios from 'axios';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// const token = document.head.querySelector('meta[name="csrf-token"]');
//
// if (token && token instanceof HTMLMetaElement) {
//     axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
// }
