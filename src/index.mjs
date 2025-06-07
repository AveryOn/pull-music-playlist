import axios from 'axios'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import PL_IDS from '../listIds.mjs'
import { exec } from 'child_process'
import { formatMsToTime, getBasePath } from './utils.mjs'
dotenv.config()

const BASE_PROJECT_PATH = getBasePath()
const BASE_MEDIA_PATH = process.env.BASE_MEDIA_PATH || '~/Music'
const API_KEY = process.env.API_KEY
const API_URL = 'https://www.googleapis.com/youtube/v3'

/**
 * Стягивает все аудиозаписи с плейлиста youtube music. 
 * Вывод дает максимум `50` элементов. 
 * * Если песен дохуя, нужна пагинация за счет передачи `nextPageToken`
 * @param {string} ID - айдишник плейлиста
 * @param {string} nextPageToken  - токен следующей страницы. для пагинации. Если есть, то подгружает её.
 * @returns {Promise<{ nextPageToken: string | null, data: Record<string, any>[] }>}
 */
async function pullList(ID, nextPageToken) {
    try {
        if(!ID || typeof ID !== 'string') 
            throw 'fuck you! Where my fucking playlist ID??!'
        const params = {
            part: 'snippet',
            maxResults: 50,
            playlistId: ID,
            key: API_KEY,
            // si: 'Q-WnvxMmjFtqQVqa',
          };
        if (nextPageToken) {
            params.pageToken = nextPageToken;
        }
        const { data } = await axios.get(API_URL + `/playlistItems`, { params })
        const items = data?.items ?? []
        return {
            nextPageToken: data?.nextPageToken ?? null,
            data: items,
        }
    } catch (err) {
        console.error('[pullList] ERROR:', err)
        throw err
    }
}

/**
 * Получает информацию плейлиста по его ID
 * @param {string} ID - айдишник плейлиста
 * @returns {Promise<string | null>}
 */
async function fetchPlaylistInfo(ID) {
    try {
        const { data } = await axios.get('https://www.googleapis.com/youtube/v3/playlists', {
            params: {
                part: 'snippet',
                id: ID,
                key: API_KEY,
            }
        })
        const playlistTitle = data.items[0]?.snippet?.title
        return playlistTitle || null
    } catch (err) {
        console.error(err);
        throw err;
    }
}

/**
 * Проходит по всем ID плейлистов из `PL_IDS` и для каждого выполняет pull всех песен в json-файл 
 * @returns {Promise<Record<string, any[]>>}
 */
async function pullWholeList() {
    const lists = {}
    for (let i = 0; i < PL_IDS.length; i++) {
        const ID = PL_IDS[i];
        const plTitle = await fetchPlaylistInfo(ID)

        const listKeyName = `${plTitle ?? 'playlist_' + i+1}`
        lists[listKeyName] = []
        let nextPageToken

        do {
            try {
                const { data: items, nextPageToken: pageToken } = await pullList(ID, nextPageToken)
                nextPageToken = pageToken
                lists[listKeyName] = [
                    ... lists[listKeyName], 
                    ...(Array.isArray(items)? items : []).map((item) => ({
                        videoId:     item?.snippet?.resourceId?.videoId ?? null,
                        title:       item?.snippet?.title ?? null,
                        image:       item?.snippet?.thumbnails?.default ?? null,
                        playlistId:  item?.snippet?.playlistId ?? null,
                        position:    item?.snippet?.position ?? null,
                        description: item?.snippet?.description ?? null,
                        publishedAt: item?.snippet?.publishedAt ?? null,
                        publishedAt_unx: item?.snippet?.publishedAt ? 
                            new Date(item?.snippet?.publishedAt).getTime() : 
                            null
                    }))
                ]
                console.debug('[pullList] amount pulled:',  lists[listKeyName].length)
                fs.writeFileSync(
                    path.join(BASE_PROJECT_PATH, `list.json`), 
                    JSON.stringify(lists, null, 2)
                )
            } catch (err) {
                console.error(err)
                nextPageToken = undefined
                throw err
            }
        } 
        while (!!nextPageToken);
    }
    return lists
}

/**
 * Скачивает один аудиофайл по прямой ссылке
 * @param {string} audioID - айдишник аудиозаписи в `yt` по которой нужно её скачивать
 * @param {string} outpath - путь где будет сохранен файл _(относительно директории ./output)_
 * @returns {Promise<{ success: boolean, execTime: number }>} 
 */
async function downloadAudio(audioID, outpath) {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
        try {
            if(!audioID || typeof audioID !== 'string') {
                throw '[ERROR] invalid audioID'
            }
            if(!outpath || typeof outpath !== 'string') {
                throw '[ERROR] invalid outpath'
            }

            const LOAD_URL = 'https://music.youtube.com/watch';
            const CURRENT_URL = LOAD_URL + '?v=' + audioID;
            const CURRENT_PATH = path.join(BASE_MEDIA_PATH, 'output', outpath)
            const SCRIPT_PATH = path.join(BASE_PROJECT_PATH, 'audio_load.sh')

            exec(`${SCRIPT_PATH} ${CURRENT_URL} ${CURRENT_PATH}`, (err, stdout) => {
                console.log('stdout', stdout)
                resolve({
                    execTime: Date.now() - startTime,
                    success: !err,
                })
            }) 
        } catch (err) {
            console.error(err)
            reject(err)
        }
    })
}

/**
 * Проводит скачивание всех аудизописей для каждого плейлиста
 * @param {Record<string, any[]>} playlists - хэштаблица плейлистов
 * @returns {Promise<{amount: number, time: number, failedLoadCount: number, successLoadCount: number }>}
 */
async function downloadAllAudio (playlists) {
    const keys = Object.keys(playlists);
    const allListsLength = keys.reduce((acc, key) => (acc + playlists[key].length), 0);
    let infoTableOutput = [];
    const MAX_LENGTH_DEBUG_BUFFER = 30;
    let amount = 0;
    let generalExecutionTime = 0;
    let failedLoadCount = 0;
    let successLoadCount = 0;

    for (const key of keys) {
        const list = playlists[key];
        if(Array.isArray(list)) {
            for (const audio of list) {
                if(audio?.videoId) {
                    ++amount;
                    console.clear();

                    const title = (audio?.title?.length > 50) ?
                        audio.title?.slice(0, 50) + '...' :
                        audio.title;
                    const playlistTitle = (key?.length > 50) ?
                        key?.slice(0, 50) + '...' :
                        key;
                    const percent = ((amount / allListsLength) * 100).toFixed(2) + ' %';

                    infoTableOutput.push({ 
                        'N': amount,
                        'Title': title,
                        'ID': audio.videoId,
                        'Download Time': 'pending...',
                        'Playlist': playlistTitle,
                        'Status': 'pending',
                        '%': percent,
                    });
                    console.table(infoTableOutput);
                    const info = await downloadAudio(audio.videoId, key);
                    generalExecutionTime += info.execTime;
                    (info.success === true) ? successLoadCount++ : failedLoadCount++ 
                    
                    const execTime = formatMsToTime(info.execTime);
                    const status = info.success ? 'SUCCESS' : 'FAILED';

                    infoTableOutput.pop();
                    console.clear();
                    infoTableOutput.push({
                        'N':             amount,
                        'Title':         title,
                        'ID':            audio.videoId,
                        'Download Time': execTime,
                        'Playlist':      playlistTitle,
                        'Status':        status,
                        '%':             percent,
                    });
                    if(infoTableOutput.length > MAX_LENGTH_DEBUG_BUFFER) {
                        infoTableOutput = infoTableOutput.slice(infoTableOutput.length - MAX_LENGTH_DEBUG_BUFFER)
                        if(infoTableOutput[0].N !== '...') {
                            infoTableOutput.unshift({ 'N': '---','Title': '---','ID': '---','Download Time': '---','Playlist': '---','Status': '---','%': '---' });
                        }
                    }
                    console.table(infoTableOutput);
                }
            }
        }
    }
    return {
        amount,
        time: generalExecutionTime,
        failedLoadCount,
        successLoadCount,
    }
}


(async () => {
    const playlists = await pullWholeList()
    const result = await downloadAllAudio(playlists)
    console.table([{
        'Amount':           result.amount,
        'Time':             formatMsToTime(result.time),
        'Failed Amount':    result.failedLoadCount,
        'Success Amount':   result.successLoadCount,
    }])
})()
