use std::io::Write;

fn log_to_file(msg: String) {
    if let Ok(mut f) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open("log.txt")
    {
        let now = chrono::Local::now();
        let _ = writeln!(
            f,
            "{:=^80}",
            format!("[{}::{}]", now.date_naive(), now.time())
        );
        let _ = writeln!(f, "{}", msg);
        let _ = writeln!(f, "{:=>90}", "");
    }
}

#[derive(Debug)]
pub enum AppErrors {
    #[allow(dead_code)]
    FailedToGetDataFromDatabase(String),
    #[allow(dead_code)]
    FailedToUpdateDatabase(String),
    #[allow(dead_code)]
    NotLoggedIn(String),
    #[allow(dead_code)]
    NotAllowed(String)
}

impl serde::Serialize for AppErrors {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        log_to_file(format!("{:?}", self));
        
        let msg = match self {
            AppErrors::FailedToGetDataFromDatabase(_) => "Failed to get data from database due to an error",
            AppErrors::FailedToUpdateDatabase(_) => "Failed to update data due to an error",
            AppErrors::NotLoggedIn(_) => "Please log in again",
            AppErrors::NotAllowed(_) => "You don't have permission to do this",
        };
        
        serializer.serialize_str(msg)
    }
}
