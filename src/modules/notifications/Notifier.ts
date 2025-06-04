import NotificationOption from './NotificationOption';
import Sound from '../utilities/Sound';
import Rand from '../utilities/Rand';
import * as DisplayObservables from '../utilities/DisplayObservables';
import type NotificationSetting from '../settings/NotificationSetting';

type QueuedModalNotification = {
    content: HTMLElement,
    sound?: Sound,
    timeout?: number,
    onShown?: () => void,
    onHidden?: () => void,
};

export default class Notifier {
    private static modalQueue: QueuedModalNotification[] = [];
    private static modalOpen = false;

    public static notify({
        message,
        type = NotificationOption.primary,
        title = '',
        timeout = 3000,
        time = 'just now',
        sound,
        setting,
        image,
        pokemonImage,
        strippedMessage,
    }: {
        message?: string;
        type?: NotificationOption;
        title?: string;
        timeout?: number;
        time?: string;
        sound?: Sound;
        setting?: NotificationSetting;
        image?: string;
        pokemonImage?: string;
        strippedMessage?: string;
    }): void {
        $(document).ready(() => {
            // If we have sounds enabled for this, play it now
            if (sound) {
                sound.play();
            }

            if (setting && setting.desktopNotification.value && Notification.permission === 'granted') {
                const tempEl = document.createElement('div');
                tempEl.innerHTML = strippedMessage ?? message.replace(/<br\s*[/]?>/gi, '\n');
                const msg = tempEl.innerText.replace(/  +/g, ' ');
                const desktopNotification = new Notification(title, {
                    body: msg,
                    icon: image,
                    silent: true,
                });
                setTimeout(() => {
                    desktopNotification.close();
                }, timeout);
            }

            // Check if this type of notification is disabled
            if (setting && setting.inGameNotification && !setting.inGameNotification.value) {
                return;
            }

            // Get the notification ready to display
            const toastID = Rand.string(7);
            const toastHTML = `<div id="${toastID}" class="toast bg-${NotificationOption[type]}" data-autohide="false">
                ${title ? `<div class="toast-header">
                    ${image ? `<img src="${image}" class="icon" />` : ''}
                    ${pokemonImage ? `<img src="${pokemonImage}" class="pokemonIcon" />` : ''}
                    <strong class="mr-auto text-primary">${title || ''}</strong>
                    <small class="text-muted">${time}</small>
                    <button type="button" class="ml-2 mb-1 close" data-dismiss="toast">×</button>
                </div>` : ''}
                <div class="toast-body text-light d-flex align-items-center">
                    ${!title && image ? `<img src="${image}" class="icon" />` : ''}
                    ${!title && pokemonImage ? `<img src="${pokemonImage}" class="pokemonIcon" />` : ''}
                    <span class="flex-grow-1">${message.replace(/\n/g, '<br/>')}</span>
                    ${title ? '' : '<button type="button" class="close align-self-start" data-dismiss="toast">×</button>'}
                </div>
                </div>`;

            $('#toaster').prepend(toastHTML);

            // Show the notification
            $(`#${toastID}`)?.toast('show');

            // Once the notification is shown, hide it after specified timeout
            $(`#${toastID}`).on('shown.bs.toast', () => {
                setTimeout(() => {
                    $(`#${toastID}`).toast('hide');
                }, timeout);
            });

            // Once hidden remove the element
            $(`#${toastID}`).on('hidden.bs.toast', () => {
                document.getElementById(toastID).remove();
            });
        });
    }

    private static enqueueModalNotification(data: QueuedModalNotification) {
        if (Notifier.modalOpen) {
            Notifier.modalQueue.push(data);
        } else {
            Notifier.displayModalNotification(data);
        }
    }

    private static dequeueModalNotification() {
        Notifier.displayModalNotification(Notifier.modalQueue.shift());
    }

    private static displayModalNotification(data: QueuedModalNotification) {
        const { content, sound, timeout, onShown, onHidden } = data;
        const modal = $('#notifierDialogModal');

        document.getElementById('notifierDialogModal-container').append(content);

        Notifier.modalOpen = true;
        // Start opening the modal
        modal.modal({
            backdrop: 'static',
            show: true,
        });

        // If we have sounds enabled for this, play it now
        if (sound) {
            sound.play();
        }

        // Actions once the modal is shown
        modal.one('shown.bs.modal', () => {
            if (onShown) {
                onShown();
            }
            if (timeout > 0) {
                // Hide the modal after specified timeout
                const timeoutID = setTimeout(() => modal.modal('hide'), timeout);
                // Clear timeout if the modal is closed first
                modal.one('hide.bs.modal', () => clearTimeout(timeoutID));
            }
        });

        // Actions once the modal is hidden
        modal.one('hidden.bs.modal', () => {
            if (onHidden) {
                onHidden();
            }
            Notifier.clearModalContent();
            Notifier.modalOpen = false;
            // Display next notification
            if (Notifier.modalQueue.length) {
                Notifier.dequeueModalNotification();
            }
        });
    }

    private static clearModalContent() {
        document.getElementById('notifierDialogModal-container').replaceChildren();
    }

    public static prompt({
        title,
        message,
        type = NotificationOption.primary,
        timeout = 0,
        sound = null,
    }: {
        title: string;
        message: string;
        type?: NotificationOption;
        timeout?: number;
        sound?: Sound;
    }): Promise<string> {
        return new Promise((resolve) => {
            // Get the notification ready to display
            const dialogBody = `${message.replace(/\n/g, '<br/>')}<br/><br/>
                <input class="outline-dark form-control" placeholder="Type here..." id="notifierDialogModal-promptInput" type="text">`;
            const dialogContent = Notifier.createDialogContent(title, dialogBody, type, 'Submit');

            (dialogContent.querySelector('#notifierDialogModal-promptInput') as HTMLInputElement).addEventListener('keyup', ({ key }) => {
                if (key === 'Enter') {
                    $('#notifierDialogModal').modal('hide');
                }
                if (key === 'Escape') {
                    $('#notifierDialogModal-promptInput').val('');
                }
            });

            // Clean the input if the player closes the modal with the X
            (dialogContent.querySelector('#notifierDialogModal-closeButton') as HTMLInputElement).addEventListener('click', () => {
                $('#notifierDialogModal-promptInput').val('');
            });

            Notifier.enqueueModalNotification({
                content: dialogContent,
                sound: sound,
                timeout: timeout,
                onShown: () => (document.getElementById('notifierDialogModal-promptInput') as HTMLInputElement).focus(),
                onHidden: () => {
                    const inputEl = document.getElementById('notifierDialogModal-promptInput') as HTMLInputElement;
                    const inputValue = inputEl?.value;
                    resolve(inputValue);
                },
            });
        });
    }

    public static confirm({
        title,
        message,
        confirm = 'Ok',
        cancel = 'Cancel',
        type = NotificationOption.primary,
        timeout = 0,
        sound = null,
    }: {
        title: string;
        message: string;
        confirm?: string;
        cancel?: string;
        type?: NotificationOption;
        timeout?: number;
        sound?: Sound;
    }): Promise<boolean> {
        return new Promise((resolve) => {
            // Get the notification ready to display
            const dialogContent = Notifier.createDialogContent(title, message.replace(/\n/g, '<br/>'), type, confirm, cancel);

            // Confirm button
            (dialogContent.querySelector('#notifierDialogModal-buttonA') as HTMLInputElement).addEventListener('click', () => {
                resolve(true);
            });

            Notifier.enqueueModalNotification({
                content: dialogContent,
                sound: sound,
                timeout: timeout,
                onHidden: () => resolve(false),
            });
        });
    }

    public static warning({
        title,
        message,
        confirm = 'I understand',
        type = NotificationOption.primary,
        timeout = 0,
        sound = null,
    }: {
        title: string;
        message: string;
        confirm?: string;
        type?: NotificationOption;
        timeout?: number;
        sound?: Sound;
    }): Promise<boolean> {
        return new Promise((resolve) => {
            // Get the notification ready to display
            const dialogBody = `<div class="text-center"><i class="text-warning">${message.replace(/\n/g, '<br/>')}</i></div>`;
            const dialogContent = Notifier.createDialogContent(title, dialogBody, type, confirm);

            (dialogContent.querySelector('#notifierDialogModal-buttonA') as HTMLInputElement).addEventListener('click', () => {
                resolve(true);
            });

            Notifier.enqueueModalNotification({
                content: dialogContent,
                sound: sound,
                timeout: timeout,
                onHidden: () => resolve(false),
            });
        });
    }

    private static createDialogContent(title: string, dialogBody: string, type: NotificationOption, buttonA: string, buttonB?: string) {
        const dialogContent = document.createElement('div');
        dialogContent.innerHTML = `
        <div class="modal-header modal-header pb-0 pt-2 px-2 bg-${NotificationOption[type]}">
            <h5>${title}</h5>
            <button id="notifierDialogModal-closeButton" type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
        <div class="modal-body py-2 px-2 text-left">
            ${dialogBody}
        </div>
        <div class="modal-footer p-2">
            <button id="notifierDialogModal-buttonA" class="btn col outline-dark btn-${NotificationOption[type]}" data-dismiss="modal">${buttonA}</button>
            ${ buttonB ? `<button id="notifierDialogModal-buttonB" class="btn col outline-dark btn-secondary" data-dismiss="modal">${buttonB}</button>` : ''}
        </div>`;
        return dialogContent;
    }
}
