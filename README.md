# Утилита для скачивания аудиозаписей с ютуба
---

## Перед использованием

 1. Получить `API_KEY` по [**ссылке**](https://console.cloud.google.com/)
     _(как это делать можно погуглить)_
 2. Полученный `API_KEY` положить в `.env` файл
     _(есть .env.example для примера)_
 3. Создать в корне проекта файл `listIds.mjs`. 
 4. Экспортировать по умолчанию оттуда массив айдишников плейлистов, с которых ты хочешь грузить песни
 5. выглядеть содержимое файла должно примерно так:

```javascript
export default [
    'PL_playlist_id_example_69',
    ...
]
```
_По айдишникам плейлистов, которые прописаны в этом массиве, алгоритм будет вытаскивать ссылки на их аудиозаписи. Нужно для дальнейшего скачивания аудиозаписей_

---

## Установка для Linux

1. Установить tool yt-dlp на свою железяку
 ```bash
    pip install -U yt-dlp
 ```
2. Установить то что надо
 ```bash
    sudo dnf install ffmpeg # Fedora
    # или
    sudo apt install ffmpeg # Debian/Ubuntu
 ```
3. Проверка
 ```bash
    yt-dlp --version
    ffmpeg -version
 ```

## Установка для Windows / Mac
 1. скачать на флешку любой адекватный дистрибутив Linux
 2. Запускать её при загрузке железа как вторую ОС 
 3. Продолжить с раздела `Установка для Linux`

---
## Запуск проекта

1. Создать файл .env _(по примеру .env.example)_
2. Указать в `BASE_MEDIA_PATH` переменную путь до той папки куда будут идти скачанные файлы

3. Установка зависимостей:
 ```bash
 npm ci
 ```

4. Запуск алгоритма скачивания:
 ```bash
 npm run start
 ```

---
## Пример вывода в терминале в момент скачивания
```plain
    ┌─────────┬───────┬────────────────────────┬───────────────┬───────────────┬──────────┬───────────┬───────────┐
    │ (index) │ N     │ Title                  │ ID            │ Download Time │ Playlist │ Status    │ %         │
    ├─────────┼───────┼────────────────────────┼───────────────┼───────────────┼──────────┼───────────┼───────────┤
    │ 0       │ '---' │ '---'                  │ '---'         │ '---'         │ '---'    │ '---'     │ '---'     │
    │ 1       │ 84    │ 'WXCHSXN - ALTYN FUNK' │ 'X7gх0jymD0Y' │ '00:00:02'    │ 'Mus_1'  │ 'FAILED'  │ '42.21 %' │
    │ 2       │ 85    │ 'Little Monster'       │ 'BgnloneI9Ig' │ '00:00:09'    │ 'Mus_1'  │ 'SUCCESS' │ '42.71 %' │
    │ 3       │ 114   │ 'Heaven Help Me'       │ 'cC8E1-hh8LY' │ 'pending...'  │ 'Mus_1'  │ 'pending' │ '57.29 %' │
    └─────────┴───────┴────────────────────────┴───────────────┴───────────────┴──────────┴───────────┴───────────┘
```

## Пример вывода в терминале по окончанию скачивания

```plain
    ┌─────────┬────────┬────────────┬───────────────┬────────────────┐
    │ (index) │ Amount │   Time     │ Failed Amount │ Success Amount │
    ├─────────┼────────┼────────────┼───────────────┼────────────────┤
    │    0    │   50   │ '00:00:12' │       3       │       47       │
    └─────────┴────────┴────────────┴───────────────┴────────────────┘
```
