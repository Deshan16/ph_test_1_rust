use std::io::Write;


fn log_to_file(msg: String) {
    if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open("log.txt") {
        let now  = chrono::Local::now();
        let _ = writeln!(f, "{:=^40}", format!("[{}::{}]", now.date_naive(), now.time()));
        let _ = writeln!(f, "{}", msg);
        let _ = writeln!(f, "{:=>50}", "");
    }
}

#[derive(Debug)]
pub enum AppErrors {
    FailedToWriteToDatabase(String),
    FailedToGetDataFromFrontend(String),
    FailedToGetDataFromDatabase(String),
    FailedToUpdateDatabase(String)
}

impl serde::Serialize for AppErrors {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        log_to_file(format!("{:?}", self));
        
        let msg = match self {
            AppErrors::FailedToWriteToDatabase(_) => "Failed to write data to database due to an error",
            AppErrors::FailedToGetDataFromFrontend(_) => "Failed to read data sent from frontend",
            AppErrors::FailedToGetDataFromDatabase(_) => "Failed to get data from database due to an error",
            AppErrors::FailedToUpdateDatabase(_) => "Failed to update data due to an error"
        };
        
        serializer.serialize_str(msg)
    }
}