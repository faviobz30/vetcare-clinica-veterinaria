package pe.edu.utec.vetcare.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.utec.vetcare.entity.UsuarioEntity;

import java.util.Optional;

public interface UsuarioRepository
        extends JpaRepository<UsuarioEntity, Long> {

    Optional<UsuarioEntity> findByCorreo(String correo);

    boolean existsByCorreo(String correo);

    boolean existsByNroDocumento(String nroDocumento);
}