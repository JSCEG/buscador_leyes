/** The app shell's small behaviours: the phone's «Más» sheet and the rail's collapsible groups. */

export function openMoreSheet(doc = document) {
    doc.getElementById('mobile-menu-btn')?.click();
}

/** The group holding the current section stays open and marked. On the icon rail the groups fly out, so they close. */
export function syncRailGroups(doc = document) {
    doc.querySelectorAll('.bu-riel__grupo').forEach(group => {
        const current = Boolean(group.querySelector('[aria-current="page"]'));
        group.classList.toggle('is-current', current);
        if (current && !isIconRail(doc)) group.open = true;
        else if (isIconRail(doc)) group.open = false;
    });
}

function isIconRail(doc) {
    const view = doc.defaultView;
    return Boolean(view?.matchMedia?.('(max-width: 1199px)').matches);
}

/** Opening one flyout closes the other; choosing a section or clicking away closes both. */
export function initRailGroups(doc = document) {
    const groups = [...doc.querySelectorAll('.bu-riel__grupo')];
    groups.forEach(group => {
        group.addEventListener('toggle', () => {
            if (!group.open || !isIconRail(doc)) return;
            groups.forEach(other => { if (other !== group) other.open = false; });
        });
        group.querySelector('.bu-riel__subs')?.addEventListener('click', event => {
            if (event.target.closest('a') && isIconRail(doc)) group.open = false;
        });
    });
    doc.addEventListener('click', event => {
        if (!isIconRail(doc) || event.target.closest('.bu-riel__grupo')) return;
        groups.forEach(group => { group.open = false; });
    });
}
