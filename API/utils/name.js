export const fileNameExtract = async (filename) => {
    let tempArr = '';
    let name = '';
    try {
        tempArr = await filename.split('.');
        if (tempArr.length < 2) {
            name = tempArr[0];
            return [name, ''];
        }
        else {
            const extension = tempArr[tempArr.length - 1];
            tempArr.pop();
            name = tempArr.join('');
            return [name, extension];
        }
    } catch (err) {
        throw err;
    }
}