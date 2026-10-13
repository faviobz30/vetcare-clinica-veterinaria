package pe.edu.utec.vetcare.service;

import pe.edu.utec.vetcare.dto.request.LoginRequest;
import pe.edu.utec.vetcare.dto.request.RegisterRequest;
import pe.edu.utec.vetcare.dto.response.AuthResponse;
import pe.edu.utec.vetcare.dto.response.UsuarioResponse;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    UsuarioResponse register(RegisterRequest request);
}