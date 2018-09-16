const getMessage = (msg, lvl) => {
    return {
        "time": new Date().toJSON(),
        "level": lvl,
        "message": msg
    }
};

export const log = (msg) => {
    console.log(getMessage(msg, "LOG"));
};

export const error = (msg) => {
    console.error(getMessage(msg, "ERROR"));
};