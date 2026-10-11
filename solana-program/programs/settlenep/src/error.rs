use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Recipient address is not valid for settlement")]
    InvalidRecipient,
    #[msg("Transfer amount must be greater than zero")]
    InvalidAmount,
    #[msg("At least one allocation is required")]
    NoAllocations,
    #[msg("Too many allocations")]
    TooManyAllocations,
    #[msg("Allocation amounts must sum to the full transfer amount")]
    AllocationMismatch,
    #[msg("A settlement with this sender and nonce already exists")]
    DuplicateSettlement,
    #[msg("Only the sender can authorize this settlement")]
    Unauthorized,
    #[msg("Integer overflow while processing amounts")]
    MathOverflow,
}