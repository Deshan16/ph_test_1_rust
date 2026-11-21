use crate::error::AppErrors;


#[derive(Clone, serde::Serialize, sqlx::FromRow)]
pub struct CurrentUser {
    pub user_name: String,
    pub role: String
}

pub struct Session(pub std::sync::Mutex<Option<CurrentUser>>);

pub fn require_login(session: &Session) -> Result<(), AppErrors> {
    match &*session.0.lock().unwrap() {
        Some(_) => Ok(()),
        None => Err(AppErrors::NotLoggedIn("Failed to login".to_string()))
    }
}

pub fn require_admin(session: &Session) -> Result<(), AppErrors> {
    match &*session.0.lock().unwrap() {
        Some(user) if user.role == "admin" => Ok(()),
        Some(_) => Err(AppErrors::NotAllowed("Admin Privileges are required".to_string())),
        None => Err(AppErrors::NotLoggedIn("No users are logged in".to_string()))
    }
}