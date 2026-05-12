import moment from 'moment-timezone'
import Cookies from 'universal-cookie'

const cookies = new Cookies(null, { path: '/', })

function getCookies(keyName) {
    return cookies.get(keyName)
}

function setCookies(keyName, value, days = 5) {
    return cookies.set(keyName, value, {
        expires: moment().add(days, 'days').toDate(),
        path: '/',
    })
}

function removeCookies(keyName) {
    return cookies.remove(keyName)
}

export { getCookies, setCookies, removeCookies };